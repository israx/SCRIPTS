import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Create DynamoDB client with default credential chain
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create document client for simplified operations
export const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export { dynamoDBClient };
