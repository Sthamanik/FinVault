import redis from "@config/redis.config.js";
import logger from "@utils/logger.utils.js";

class CacheUtils{
    async getVersion(resource: string): Promise<number>{
        try {
            const data = await redis.get(`${resource}:version`);
            return data? Number(data) : 1;
        } catch (error) {
            logger.error(`Redis error: ${error}`);
            return 1;
        }
    }

    async incrementVersion(resource: string): Promise<void>{
        try {
            await redis.incr(`${resource}:version`);
        } catch (error) {
            logger.error(`Redis error: ${error}`);
        }
    }

    async get<T>(key: string): Promise<T | null>{
        try {
            const data = await redis.get(key);
            return data? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Redis error: ${error}`);
            return null;
        }
    }

    async set<T>(key: string, data: T, ttl: number): Promise<void>{
        try {
            await redis.set(key, JSON.stringify(data), "EX", ttl);
        } catch (error) {
            logger.error(`Redis error: ${error}`);
        }
    }

    async delete(key:string): Promise<void>{
        try {
            await redis.del(key);
        } catch (error) {
            logger.error(`Redis error: ${error}`);
        }
    }
}

export default new CacheUtils;