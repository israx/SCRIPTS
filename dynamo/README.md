# DynamoDB Attribute Updater

A TypeScript script that filters AWS DynamoDB table items missing a specific attribute and updates them with a new attribute value.

## Features

- ✅ Scans DynamoDB table in batches (first 50 items, then continues with pagination)
- ✅ Filters items that don't have a specified attribute
- ✅ Updates filtered items with a new attribute
- ✅ Uses AWS SDK v3 with default credential chain
- ✅ Comprehensive logging and error handling
- ✅ TypeScript with proper type definitions

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### Environment Variables

Set the following environment variables:

```bash
export TABLE_NAME="your-table-name"
export MISSING_ATTR="AccountId"           # Attribute to check for absence
export NEW_ATTR="AccountId"               # New attribute to add
export NEW_ATTR_VALUE="default-account-id" # Value for the new attribute
export KEY_ATTRS="id,sortKey"             # Comma-separated primary key attributes
export AWS_REGION="us-east-1"             # Optional, defaults to us-east-1
```

### Running the Script

```bash
# Using npm
npm start

# Or directly with node
node dist/index.js

# Or for development with ts-node
npm run dev
```

### Programmatic Usage

```typescript
import { processTable, filterItemsFromTable, updateItem } from './src/index';

// Process entire table
const stats = await processTable(
  'my-table',           // tableName
  'AccountId',          // missingAttributeName
  'AccountId',          // newAttributeName
  'default-account',    // newAttributeValue
  ['id', 'sortKey']     // keyAttributes (primary key fields)
);

console.log('Processing stats:', stats);
```

## AWS Credentials

The script uses the default AWS credential chain, which checks for credentials in this order:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. AWS credentials file (`~/.aws/credentials`)
3. IAM roles (if running on EC2)
4. AWS CLI configuration

Make sure your AWS credentials have the following permissions:
- `dynamodb:Scan` - to read table items
- `dynamodb:UpdateItem` - to update items

## How It Works

1. **Scan Phase**: Scans the DynamoDB table in batches
   - First batch: 50 items
   - Subsequent batches: 100 items each
   - Uses pagination to handle large tables

2. **Filter Phase**: Identifies items missing the specified attribute
   - Uses JavaScript's `in` operator to check attribute presence
   - Filters out items that already have the attribute

3. **Update Phase**: Updates each filtered item
   - Uses DynamoDB UpdateExpression to add the new attribute
   - Processes items one by one with error handling
   - Logs success/failure for each update

## Example Output

```
DynamoDB Attribute Updater
==========================
Table: my-table
Missing Attribute: AccountId
New Attribute: AccountId = default-account-id
Key Attributes: id, sortKey

Starting to process table: my-table
Looking for items missing attribute: AccountId
Will add attribute: AccountId = default-account-id
---
Scanning batch of 50 items...
Scanned 50 items (Total: 50)
Found 12 items without 'AccountId' attribute
Updating 12 items...
✓ Updated item with keys: id=item1, sortKey=sort1
✓ Updated item with keys: id=item2, sortKey=sort2
...
Batch complete: 12 successful, 0 failed
---
Processing complete!
Final Stats:
- Total items scanned: 150
- Items without 'AccountId': 25
- Successful updates: 25
- Failed updates: 0
```

## Error Handling

- Basic error handling with try-catch blocks
- Individual item update failures don't stop the entire process
- Detailed error logging for troubleshooting
- Failed updates are counted and reported in final statistics

## TypeScript Types

The script includes comprehensive TypeScript interfaces:

- `DynamoDBItem`: Represents a DynamoDB item
- `ScanResult`: Result of a table scan operation
- `UpdateResult`: Result of an item update operation
- `ProcessingStats`: Final processing statistics
