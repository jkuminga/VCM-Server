import session from 'express-session';
import redisStore from './redis.js';

const sessionConfig = session({
    secret : 'VCM_PROJECT',
    resave : false,
    saveUninitialized : true,
    store : redisStore
});

export default sessionConfig;
