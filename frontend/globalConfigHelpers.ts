import GlobalConfig from "@airtable/blocks/dist/types/src/global_config";

/** Keys for storing data in the AirTable global config */
export enum GCKey {
  PARTICIPANTS_TABLE_ID = "participantsTableId",
  PARTICIPANTS_VIEW_ID = "participantsViewId",
  BUCKETS_TABLE_ID = "bucketsTableId",
  BUCKET_FIELD_ID = "participantToBucketFieldId",
  BUCKET_SIZE = "bucketSize",
  DIMENSION_FIELD_IDS_COUNT = "dimensionFieldIds_count",
  // Prefixes array index-type numbers
  DIMENSION_FIELD_IDS_PREFIX = "dimensionFieldIds_",
}

export const get = <T,>(globalConfig: GlobalConfig, key: GCKey | string, ifMissing: T): string | T => {
  const res = globalConfig.get(key)
  return typeof res === "string" ? res : ifMissing;
}
