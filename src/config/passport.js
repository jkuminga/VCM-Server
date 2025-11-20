import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js";
import { logWithTimestamp, errorWithTimestamp } from "../utils/logger.js";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    passReqToCallback: true,
    },
    async (req, at, rt, profile, done)=>{
        try{
            const profileEmail = profile._json?.email;
            const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [profileEmail]);

            if(rows.length > 0){
                const date = new Date();
                const formatted = date.toISOString().slice(0, 19).replace('T', ' ');


                await pool.query('UPDATE user SET last_login = ?', [formatted]);
                logWithTimestamp('✅ 인증 성공, last_login 업데이트')
                return done(null, rows[0])
            }

            req.session.signupProfile = {
                id : profile.id,
                displayName : profile.displayName,
                email : profileEmail,
                provider : profile.provider,
                rt
            }

            return done(null, false,{reason : 'signup'});
            
        }catch(err){
            return done(err);
        }
    }
))

passport.serializeUser((user, done)=>{
    logWithTimestamp('세션에 사용자 등록');
    logWithTimestamp('세션에 등록할 값 : ', user.user_id);
    done(null, user.user_id);
})

passport.deserializeUser(async (id, done)=>{
    try{
        const [[user]] = await pool.query('SELECT * FROM user WHERE user_id = ?',[id])
        logWithTimestamp('➕Deserialized!')

        if(!user){
            return done(null,false);
        }

        return done(null, user);  // req.user에 user 객체 등록
    }catch(err){
        errorWithTimestamp('❌[Deserialize] 사용자 조회 중 오류 발생!');
        return done(err);
    }   
    
})

export default passport
