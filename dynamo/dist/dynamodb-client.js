"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamoDBClient = exports.docClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Create DynamoDB client with default credential chain
const dynamoDBClient = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});
exports.dynamoDBClient = dynamoDBClient;
// Create document client for simplified operations
exports.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoDBClient);
//# sourceMappingURL=dynamodb-client.js.map