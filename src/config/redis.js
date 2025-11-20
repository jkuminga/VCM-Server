import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import dotenv from 'dotenv';
import { errorWithTimestamp } from '../utils/logger.js';

dotenv.config();

const redisClient = createClient({
    url  : `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
})

redisClient.on('error', err=>errorWithTimestamp('❌Redis 클라이언트 에러 발생', err));
redisClient.connect().catch(errorWithTimestamp);


const redisStore = new RedisStore({
    client : redisClient,
    prefix : 'VCMSessionStore'
})

export default redisStore;
