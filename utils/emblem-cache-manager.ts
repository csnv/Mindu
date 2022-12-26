import { EmblemCache, EmblemCacheGroup } from "../models/emblemCache";

/**
 * Caching of emblems in memory
 */
export namespace EmblemCacheManager {
    // Main cache
    const cache: EmblemCacheGroup = {};
    // Last time cache was cleaned
    const cacheLastCheck = 0;
    // Remove cached emblems from memory if not requested in a certain time
    const CACHE_REMOVAL_TIME = 15 * 1000; // 15 minutes
    // Interval time to perform cleanups
    const CACHE_CLEAN_INTERVAL =  60 * 1000; // 1 hour

    /**
     * Initialize interval for cleaning up cache
     */
    export const init = ():void => {
        setInterval(() => clean(), CACHE_CLEAN_INTERVAL);
    };

    /**
     * Get emblem buffer from cache, if any
     * Update last time used timestamp
     * @param key Key indentifying emblem item 
     * @returns Emblem buffer or null
     */
    export const get = (key: string): Buffer | null => {
        const item = cache[key];
        if (!item) {
            return null;
        }

        const now = new Date().getTime();
        item.lastTimeUsed = now;
        return item.buffer;
    };

    /**
     * Sets a new registry in cache
     * @param key Key indentifying emblem item
     * @param buffer Emblem file buffer
     */
    export const set = (key: string, buffer: Buffer): void => {
        const now = new Date().getTime();
        cache[key] = {
            lastTimeUsed: now,
            buffer
        };
    };

    /**
     * Remove files from cache if not used recently
     */
    const clean = (): void => {
        const now = new Date().getTime();

        if (cacheLastCheck + CACHE_CLEAN_INTERVAL > now)
            return; // Still not the time to do cleanups

        const keys = Object.keys(cache);
        let deleted = 0;

        for (let i = 0; i < keys.length; i++) {
            const lastTimeUsed = cache[keys[i]].lastTimeUsed;
            if (lastTimeUsed + CACHE_REMOVAL_TIME < now) {
                delete cache[keys[i]];
                deleted++;
            }
        }

        if (deleted > 0)
            console.log(`emblem: Removed ${deleted} elements from cache`);
    };
    
}