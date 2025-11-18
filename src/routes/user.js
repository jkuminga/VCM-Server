import express from 'express';
import pool from '../config/db.js';
import usersController from '../controllers/users.controller.js';

const router = express.Router();

// 회원가입 화면 이동
router.get('/signup', (req, res)=>{
    if(!req.session.signupProfile){
        return res.redirect('/')
    }

    res.render('signup', {user : req.session.signupProfile});
})


// 회원가입 라우터
router.post('/signup', async (req, res, next)=>{
    if(!req.session.signupProfile){
        return res.redirect('/')
    }

    const {name, email, nickname, role} = req.body;

    if(!role) { 
        return res.status(400).send('회원유형을 선택해주세요!');
    }

    try{
        const pendingProfile = req.session.signupProfile;
        const newUser = {
            google_id: pendingProfile.id,
            displayName: name,
            email,
            nickname,
            role,
            provider: pendingProfile.provider,
            photo: pendingProfile.photos && pendingProfile.photos[0] ? pendingProfile.photos[0].value : null,
            accessToken: pendingProfile.accessToken,
            refreshToken: pendingProfile.refreshToken,
        };

        const [result] = await pool.query("INSERT INTO user (name, google_id, email, refresh_token, role) VALUES (?,?,?,?,?)", 
            [newUser.displayName, newUser.google_id, newUser.email, newUser.refreshToken, newUser.role]
        );

        newUser['id'] = result.insertId;

        delete req.session.signupProfile;

        req.logIn(newUser, (err)=>{
            if(err){
                return next(err);
            }
            res.redirect('/');
        })
    }catch(error){
        next(error);
    }
})


// 마이페이지 화면 
router.get('/mypage',(req,res)=>{
    usersController.getUserInfo(req,res);  
})

// 사용자가 등록한 프로젝트 목록 받아오기
router.get('/projects', (req, res)=>{
    usersController.getUsersProjectsList(req, res);
})

export default router;