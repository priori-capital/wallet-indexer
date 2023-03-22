export const config = {
  version: String(process.env.VERSION),
  port: Number(process.env.PORT),

  rpc1: String(process.env.RPC_1),
  ws1: String(process.env.WS_1),
  rpc137: String(process.env.RPC_137),
  ws137: String(process.env.RPC_137),

  adminApiKey: String(process.env.ADMIN_API_KEY),
  bullmqAdminPassword: String(process.env.BULLMQ_ADMIN_PASSWORD),
  arweaveRelayerKey: process.env.ARWEAVE_RELAYER_KEY
    ? String(process.env.ARWEAVE_RELAYER_KEY)
    : undefined,
  oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY
    ? String(process.env.ORACLE_PRIVATE_KEY)
    : undefined,

  traceNetworkHttpUrl: String(
    process.env.TRACE_NETWORK_HTTP_URL ?? process.env.BASE_NETWORK_HTTP_URL
  ),
  openseaIndexerApiBaseUrl: String(process.env.OPENSEA_INDEXER_API_BASE_URL),

  // When running in liquidity-only mode, all metadata processes are disabled
  liquidityOnly: !process.env.METADATA_API_BASE_URL,
  metadataIndexingMethod: String(process.env.METADATA_INDEXING_METHOD || "opensea"),
  metadataIndexingMethodCollection: String(
    process.env.METADATA_INDEXING_METHOD_COLLECTION ||
      process.env.METADATA_INDEXING_METHOD ||
      "opensea"
  ),
  metadataApiBaseUrl: String(process.env.METADATA_API_BASE_URL),
  metadataApiBaseUrlAlt: String(
    process.env.METADATA_API_BASE_URL_ALT || process.env.METADATA_API_BASE_URL
  ),

  disableRealtimeMetadataRefresh: Boolean(Number(process.env.DISABLE_REALTIME_METADATA_REFRESH)),

  databaseUrl: String(process.env.DATABASE_URL),
  databaseSSL: Boolean(Number(process.env.DATABASE_SSL)),
  readReplicaDatabaseUrl: String(process.env.READ_REPLICA_DATABASE_URL || process.env.DATABASE_URL),
  korsoReplicaDatabaseUrl: String(
    process.env.KORSO_REPLICA_DATABASE_URL || process.env.DATABASE_URL
  ),
  writeReplicaDatabaseUrl: String(
    process.env.WRITE_REPLICA_DATABASE_URL || process.env.DATABASE_URL
  ),
  redisUrl: String(process.env.REDIS_URL),
  rateLimitRedisUrl: String(process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL),

  master: Boolean(Number(process.env.MASTER)),
  catchup: Boolean(Number(process.env.CATCHUP)),
  doBackgroundWork: Boolean(Number(process.env.DO_BACKGROUND_WORK)),
  doWebsocketWork: Boolean(Number(process.env.DO_WEBSOCKET_WORK)),
  doEventsSyncBackfill: Boolean(Number(process.env.DO_EVENTS_SYNC_BACKFILL)),
  disableOrders: Boolean(Number(process.env.DISABLE_ORDERS)),

  shouldProcessTransactionReceipts: Boolean(Number(process.env.PROCESS_TRANSACTION_RECEIPTS)),

  maxTokenSetSize: 100000,

  awsAccessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
  awsSecretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),

  dataExportS3BucketName: String(process.env.DATA_EXPORT_S3_BUCKET_NAME),
  dataExportAwsAccessRole: String(process.env.DATA_EXPORT_AWS_ACCESS_ROLE),
  dataExportAwsS3UploadRole: String(process.env.DATA_EXPORT_AWS_S3_UPLOAD_ROLE),
  dataExportAwsS3UploadExternalId: String(process.env.DATA_EXPORT_AWS_S3_UPLOAD_EXTERNAL_ID),
  dataExportS3ArchiveBucketName: process.env.DATA_EXPORT_S3_ARCHIVE_BUCKET_NAME
    ? String(process.env.DATA_EXPORT_S3_ARCHIVE_BUCKET_NAME)
    : undefined,

  looksRareApiKey: String(process.env.LOOKSRARE_API_KEY),
  openSeaApiKey: String(process.env.OPENSEA_API_KEY),
  x2y2ApiKey: String(process.env.X2Y2_API_KEY),
  cbApiKey: String(process.env.CB_API_KEY),

  railwayStaticUrl: String(process.env.RAILWAY_STATIC_URL || ""),

  cipherSecret: String(process.env.CIPHER_SECRET),

  slackApiKeyWebhookUrl: String(process.env.SLACK_API_KEY_WEBHOOK_URL),

  syncRedisUrl: String(process.env.SYNC_REDIS_URL),

  syncPacman: Boolean(Number(process.env.SYNC_PACMAN)),
};
