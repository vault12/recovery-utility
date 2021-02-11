export interface ExportAssetMetadata {
  name: string;
  size: number;
  nonce: string;
  shards: {
    id: string,
    md5: string,
    path?: string
  }[];
}

export interface ExportVaultMetadata {
  masterKey: string;
  assetsMetaData: ExportAssetMetadata[];
  shardsRequiredToUnlock: number;
}

export interface ExportIndexFileModel {
  shards: {shardId: string, fileName: string}[];
}
