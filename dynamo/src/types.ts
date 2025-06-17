export interface DynamoDBItem {
  [key: string]: any;
}

export interface ScanResult {
  items: DynamoDBItem[];
  lastEvaluatedKey?: any;
  hasMoreItems: boolean;
}

export interface UpdateResult {
  success: boolean;
  item?: DynamoDBItem;
  error?: string;
}

export interface ProcessingStats {
  totalScanned: number;
  itemsWithoutAttribute: number;
  successfulUpdates: number;
  failedUpdates: number;
}
