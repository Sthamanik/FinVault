import logger from '@utils/logger.utils';
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URI!)

redis.on('connect', ()=> {
    logger.info(`Redis server is running`);
})

redis.on('error', (err: Error)=> {
    logger.error(`Redis server is down: ${err.message}`);
})

export default redis;