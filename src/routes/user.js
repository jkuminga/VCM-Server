import express from 'express';
import pool from '../config/db.js';
import usersController from '../controllers/users.controller.js';
import { errorWithTimestamp, logWithTimestamp } from '../utils/logger.js';

const router = express.Router();

// 회원가입 화면 이동
router.get('/signup', (req, res)=>{
    if(!req.session.signupProfile){
        return res.redirect('/')
    }

    console.log(req.session.signupProfile)

    res.render('signup', {user : req.session.signupProfile});
})


// 회원가입 라우터
router.post('/signup', async (req, res, next)=>{
    usersController.signup(req, res, next);
})


// 사용자 정보반환 라우터 
router.get('/me', (req, res)=>{
    usersController.getUserInfo(req, res);
})

// 사용자가 등록한 프로젝트 목록 받아오기
router.get('/projects', (req, res)=>{
    usersController.getUsersProjectsList(req, res);
})

export default router;