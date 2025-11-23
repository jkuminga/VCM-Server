import express from 'express';
import passport from 'passport';
import { errorWithTimestamp, logWithTimestamp } from '../utils/logger.js';

const router = express.Router();

// 구글 로그인
router.get('/google', 
    passport.authenticate('google', {scope:['profile', 'email']}
));

// 구글 로그인 콜백 라우터(로직)
router.get('/google/callback' , (req, res, next)=>{
    passport.authenticate('google', (err, user, info)=>{
        console.log('Google OAuth Callback Activated!');
        if(err){
            errorWithTimestamp('❌인증 과정에서 오류 발생', err);
            return next(err);
        }

        if(!user){
            if(info && info.reason === 'signup'){
                console.log/('새로운 사용자 : 회원가입 필요');
                return res.redirect('/user/signup');
            }
            return res.redirect('/projects/1');
        }

        req.logIn(user, (loginErr)=>{
            if(loginErr){
                return next(loginErr)
            }
            //TODO: 이부분 수정하기
            res.redirect('http://localhost/projects/1');
        })
    })(req, res, next);
})


// 로그아웃 기능
router.post('/logout', (req, res, next)=>{
    req.logOut(err=>{
        if(err){
            errorWithTimestamp('❌[passport] 로그아웃 실패', err);
            return next(err);
        }

        req.session.destroy(sessionErr=>{
            if(sessionErr){
                errorWithTimestamp('❌[session] 세션 삭제 중 오류 발생', sessionErr);
                return next(err);
            }
        })
        res.clearCookie('connect.sid');

        logWithTimestamp('✅로그아웃 완료')
        //TODO: 이부분 수정하기
        return res.status(200).json({ok : true});
    })
})

export default router;
