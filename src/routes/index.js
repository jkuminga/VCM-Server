import express from 'express';
import authRoutes from './auth.js';
import projectRoutes from './projects.js';
import userRoutes from './user.js';
import axios from'axios';
import 'dotenv/config';
import { errorWithTimestamp, logWithTimestamp } from '../utils/logger.js';

const router = express.Router();

// router.get('/', (req, res) => res.render('home', { user : req.user}));

// 뉴스 기사 라우터
router.get('/news', async (req, res)=>{
    try{
        const APIKEY = process.env.NEWS_APIKEY;

        const baseUrl = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
        const query = '?&q=%22climate%22%20AND%20%22carbon%22&fq=section.name%3A(%22Climate%22%20%22Business%22)&sort=newest'
        const apikeyQuery = `&api-key=${APIKEY}`;

        const url = `${baseUrl}${query}${apikeyQuery}`;

        const { data } = await axios.get(url);
        const articles = data?.response?.docs?.map((doc)=>({
            headline : doc.headline?.main,
            img : doc.multimedia?.default.url,
            snippet : doc.snippet,
            url : doc.web_url,
            published_at : doc.pub_date
        })) ?? [];

        logWithTimestamp('✅ 뉴스 데이터 호출 성공');
        res.status(200).json({articles});
        // res.render('news', {articles, user:req.user});
    }catch(err){
        errorWithTimestamp('❌ 뉴스 데이터 호출 실패', err);
        res.status(500).json({message:'뉴스 데이터 호출 실패'});
    }
})

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/user', userRoutes);

export default router;
