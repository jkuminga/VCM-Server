import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// TODO : 이 API 삭제하기
router.get('/dashboard', (req, res)=>{
    if(!req.user){
        return res.redirect('/');
    }

    const displayName = req.user.displayName || req.user.name || req.user.email;


    res.status(200).send(`Hello ${displayName}`)
    // TODO : dashbaord 생성 및 랜더링
})


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
            id: pendingProfile.id,
            displayName: name,
            email,
            nickname,
            role,
            provider: pendingProfile.provider,
            photo: pendingProfile.photos && pendingProfile.photos[0] ? pendingProfile.photos[0].value : null,
            accessToken: pendingProfile.accessToken,
            refreshToken: pendingProfile.refreshToken,
        };

        await pool.query("INSERT INTO user (name, google_id, email, refresh_token, role) VALUES (?,?,?,?,?)", 
            [newUser.displayName, newUser.id, newUser.email, newUser.refreshToken, newUser.role]
        );

        delete req.session.signupProfile;

        req.logIn(newUser, (err)=>{
            if(err){
                return next(err);
            }
            res.redirect('/dashboard');
        })
    }catch(error){
        next(error);
    }
})


export default router;