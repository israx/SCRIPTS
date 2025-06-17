# Key Attributes in DynamoDB

## What are keyAttributes?

In the context of this DynamoDB script, `keyAttributes` refers to the **primary key attributes** of your DynamoDB table. These are the attributes that uniquely identify each item in the table.

## Why are they needed?

When updating an item in DynamoDB, you must specify the primary key to identify which specific item to update. DynamoDB requires the complete primary key to locate and modify an item.

## Types of Primary Keys in DynamoDB

### 1. Simple Primary Key (Partition Key only)
- **Single attribute** that uniquely identifies items
- Example: `['id']` or `['userId']`

```typescript
// Table with simple primary key
const keyAttributes = ['id'];

// Example item:
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 2. Composite Primary Key (Partition Key + Sort Key)
- **Two attributes** that together uniquely identify items
- Example: `['userId', 'timestamp']` or `['pk', 'sk']`

```typescript
// Table with composite primary key
const keyAttributes = ['userId', 'timestamp'];

// Example item:
{
  "userId": "user123",
  "timestamp": "2023-12-01T10:00:00Z",
  "action": "login",
  "ipAddress": "192.168.1.1"
}
```

## How the Script Uses keyAttributes

1. **Identification**: When scanning items, the script extracts the key attributes from each item
2. **Update Operation**: Uses these key attributes to build the `Key` parameter for DynamoDB UpdateCommand
3. **Logging**: Shows which items were updated by displaying their key values

```typescript
// In the updateItem function:
const key: any = {};
keyAttributes.forEach(keyAttr => {
  if (item[keyAttr] !== undefined) {
    key[keyAttr] = item[keyAttr];  // Extract key values from the item
  }
});

const command = new UpdateCommand({
  TableName: tableName,
  Key: key,  // Use the extracted key to identify the item
  UpdateExpression: `SET #attr = :val`,
  // ... other parameters
});
```

## Configuration Examples

### Environment Variable Setup

```bash
# For a table with simple primary key (just 'id')
export KEY_ATTRS="id"

# For a table with composite primary key
export KEY_ATTRS="userId,timestamp"

# For a table with partition key 'pk' and sort key 'sk'
export KEY_ATTRS="pk,sk"

# Multiple key attributes (comma-separated)
export KEY_ATTRS="customerId,orderId,itemId"
```

### Programmatic Usage

```typescript
// Simple primary key
await processTable(
  'users-table',
  'AccountId',
  'AccountId', 
  'default-account',
  ['id']  // keyAttributes
);

// Composite primary key
await processTable(
  'user-sessions-table',
  'AccountId',
  'AccountId',
  'default-account', 
  ['userId', 'sessionId']  // keyAttributes
);
```

## Important Notes

1. **Must match your table schema**: The keyAttributes must exactly match the primary key definition of your DynamoDB table
2. **Case sensitive**: Attribute names are case-sensitive
3. **Required for updates**: Without the correct key attributes, the update operations will fail
4. **Order doesn't matter**: The array order doesn't affect functionality, but consistency is good practice

## Common Mistakes

❌ **Wrong attribute names**
```typescript
// If your table uses 'userId' but you specify 'user_id'
const keyAttributes = ['user_id'];  // This will fail
```

❌ **Missing sort key**
```typescript
// If your table has composite key [userId, timestamp] but you only specify partition key
const keyAttributes = ['userId'];  // This will fail for composite key tables
```

❌ **Including non-key attributes**
```typescript
// Including regular attributes that are not part of the primary key
const keyAttributes = ['id', 'name', 'email'];  // 'name' and 'email' are not key attributes
```

✅ **Correct usage**
```typescript
// Match your table's exact primary key definition
const keyAttributes = ['userId', 'timestamp'];  // Matches table schema
