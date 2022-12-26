export interface EmblemCacheGroup {
    [key: string]: EmblemCache
};

export interface EmblemCache {
    lastTimeUsed: EpochTimeStamp,
    buffer: Buffer
}