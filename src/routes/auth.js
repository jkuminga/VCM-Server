import express from 'express';
import passport from 'passport';

const router = express.Router();

// 구글 로그인 화면
router.get('/google', 
    passport.authenticate('google', {scope:['profile', 'email']}
));

// 구글 로그인 콜백 라우터(로직)
router.get('/google/callback' , (req, res, next)=>{
    passport.authenticate('google', (err, user, info)=>{
        if(err){
            console.error('❌인증 과정에서 오류 발생',err);
            return next(err);
        }

        if(!user){
            if(info && info.reason === 'signup'){
                return res.redirect('/signup');
            }
            return res.redirect('/projects');
        }

        req.logIn(user, (loginErr)=>{
            if(loginErr){
                return next(loginErr)
            }
            res.redirect('/projects/1');
        })
    })(req, res, next);
})

export default router;
