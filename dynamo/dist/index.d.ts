import { DynamoDBItem, ScanResult, UpdateResult, ProcessingStats } from './types';
/**
 * Scans a DynamoDB table in batches
 */
declare function scanTableBatch(tableName: string, limit: number, lastEvaluatedKey?: any): Promise<ScanResult>;
/**
 * Filters items from table that do not have a given attribute present
 */
declare function filterItemsFromTable(items: DynamoDBItem[], attributeName: string): DynamoDBItem[];
/**
 * Updates a single item with an additional attribute
 */
declare function updateItem(tableName: string, item: DynamoDBItem, attributeName: string, attributeValue: string, keyAttributes: string[]): Promise<UpdateResult>;
/**
 * Processes updates for a batch of items
 */
declare function batchUpdateItems(tableName: string, items: DynamoDBItem[], attributeName: string, keyAttributes: string[]): Promise<{
    successful: number;
    failed: number;
}>;
/**
 * Main function to process the entire table
 */
declare function processTable(tableName: string, missingAttributeName: string, newAttributeName: string, keyAttributes?: string[]): Promise<ProcessingStats>;
export { scanTableBatch, filterItemsFromTable, updateItem, batchUpdateItems, processTable };
//# sourceMappingURL=index.d.ts.map