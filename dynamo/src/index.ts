import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamodb-client';
import { DynamoDBItem, ScanResult, UpdateResult, ProcessingStats } from './types';

/**
 * Scans a DynamoDB table in batches
 */
async function scanTableBatch(
  tableName: string,
  limit: number,
  lastEvaluatedKey?: any
): Promise<ScanResult> {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    });

    const response = await docClient.send(command);
    
    return {
      items: response.Items || [],
      lastEvaluatedKey: response.LastEvaluatedKey,
      hasMoreItems: !!response.LastEvaluatedKey
    };
  } catch (error) {
    console.error(`Error scanning table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Filters items from table that do not have a given attribute present
 */
function filterItemsFromTable(
  items: DynamoDBItem[],
  attributeName: string
): DynamoDBItem[] {
  return items.filter(item => !(attributeName in item));
}

/**
 * Updates a single item with an additional attribute
 */
async function updateItem(
  tableName: string,
  item: DynamoDBItem,
  attributeName: string,
  attributeValue: string,
  keyAttributes: string[]
): Promise<UpdateResult> {
  try {
    // Build the key object from the item
    const key: any = {};
    keyAttributes.forEach(keyAttr => {
      if (item[keyAttr] !== undefined) {
        key[keyAttr] = item[keyAttr];
      }
    });

    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET #attr = :val`,
      ExpressionAttributeNames: {
        '#attr': attributeName
      },
      ExpressionAttributeValues: {
        ':val': attributeValue
      },
      ReturnValues: 'ALL_NEW'
    });

    const response = await docClient.send(command);
    
    return {
      success: true,
      item: response.Attributes
    };
  } catch (error) {
    console.error(`Error updating item:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Processes updates for a batch of items
 */
async function batchUpdateItems(
  tableName: string,
  items: DynamoDBItem[],
  attributeName: string,
  keyAttributes: string[]
): Promise<{ successful: number; failed: number }> {
  let successful = 0;
  let failed = 0;

  for (const item of items) {
    const accountId = getAccountIdFromArn(item['AgentArn']);
    const result = await updateItem(tableName, item, attributeName, accountId, keyAttributes);
    if (result.success) {
      successful++;
      console.log(`✓ Updated item with keys: ${keyAttributes.map(k => `${k}=${item[k]}`).join(', ')}`);
    } else {
      failed++;
      console.error(`✗ Failed to update item with keys: ${keyAttributes.map(k => `${k}=${item[k]}`).join(', ')} - ${result.error}`);
    }
  }

  return { successful, failed };
}

/**
 * Extracts the account ID from an AWS ARN
 * ARN format: arn:partition:service:region:account-id:resource
 * Example: arn:aws:genesis:us-west-2:886436930021:agent/cec918a7-b0c3-4198-af01-017b689a35a9
 * Returns: 886436930021
 */
function getAccountIdFromArn(value: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error('Invalid ARN: ARN must be a non-empty string');
  }

  const arnParts = value.split(':');
  
  // ARN should have at least 6 parts: arn:partition:service:region:account-id:resource
  if (arnParts.length < 6) {
    throw new Error(`Invalid ARN format: ${value}. Expected format: arn:partition:service:region:account-id:resource`);
  }

  // Account ID is the 5th part (index 4)
  const accountId = arnParts[4];
  
  if (!accountId) {
    throw new Error(`No account ID found in ARN: ${value}`);
  }

  // Validate that account ID is numeric and 12 digits
  if (!/^\d{12}$/.test(accountId)) {
    throw new Error(`Invalid account ID format: ${accountId}. Account ID must be 12 digits`);
  }

  return accountId;
}

/**
 * Main function to process the entire table
 */
async function processTable(
  tableName: string,
  missingAttributeName: string,
  newAttributeName: string,
  keyAttributes: string[] = ['id'] // Default to 'id', but should be provided based on table schema
): Promise<ProcessingStats> {
  console.log(`Starting to process table: ${tableName}`);
  console.log(`Looking for items missing attribute: ${missingAttributeName}`);
  console.log('---');

  const stats: ProcessingStats = {
    totalScanned: 0,
    itemsWithoutAttribute: 0,
    successfulUpdates: 0,
    failedUpdates: 0
  };

  let lastEvaluatedKey: any = undefined;
  let isFirstBatch = true;

  do {
    // First batch: 50 items, subsequent batches: 100 items
    const batchSize = isFirstBatch ? 50 : 100;
    
    console.log(`Scanning batch of ${batchSize} items...`);
    
    const scanResult = await scanTableBatch(tableName, batchSize, lastEvaluatedKey);
    const scannedItems = scanResult.items;
    
    stats.totalScanned += scannedItems.length;
    console.log(`Scanned ${scannedItems.length} items (Total: ${stats.totalScanned})`);

    // Filter items that don't have the specified attribute
    const itemsToUpdate = filterItemsFromTable(scannedItems, missingAttributeName);
    stats.itemsWithoutAttribute += itemsToUpdate.length;
    
    console.log(`Found ${itemsToUpdate.length} items without '${missingAttributeName}' attribute`);

    if (itemsToUpdate.length > 0) {
      console.log(`Updating ${itemsToUpdate.length} items...`);
      
      const updateResults = await batchUpdateItems(
        tableName,
        itemsToUpdate,
        newAttributeName,
        keyAttributes
      );
      
      stats.successfulUpdates += updateResults.successful;
      stats.failedUpdates += updateResults.failed;
      
      console.log(`Batch complete: ${updateResults.successful} successful, ${updateResults.failed} failed`);
    }

    lastEvaluatedKey = scanResult.lastEvaluatedKey;
    isFirstBatch = false;
    
    console.log('---');
  } while (lastEvaluatedKey);

  console.log('Processing complete!');
  console.log(`Final Stats:`);
  console.log(`- Total items scanned: ${stats.totalScanned}`);
  console.log(`- Items without '${missingAttributeName}': ${stats.itemsWithoutAttribute}`);
  console.log(`- Successful updates: ${stats.successfulUpdates}`);
  console.log(`- Failed updates: ${stats.failedUpdates}`);

  return stats;
}

// Example usage (uncomment and modify as needed)
async function main() {
  try {
    // Configuration
    const tableName = "AgentEndpoint"
    const missingAttributeName = 'AccountId';
    const newAttributeName = 'AccountId';
    const keyAttributes = ["AgentArn", "EndpointName"];// PK;SK

    console.log('DynamoDB Attribute Updater');
    console.log('==========================');
    console.log(`Table: ${tableName}`);
    console.log(`Missing Attribute: ${missingAttributeName}`);
    console.log(`Key Attributes: ${keyAttributes.join(', ')}`);
    console.log('');

    await processTable(tableName, missingAttributeName, newAttributeName, keyAttributes);
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Export functions for external use
export {
  scanTableBatch,
  filterItemsFromTable,
  updateItem,
  batchUpdateItems,
  processTable
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}
