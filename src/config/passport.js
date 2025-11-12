import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js";

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
                console.log('✅ 인증 성공')
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
    console.log('세션에 사용자 등록');
    done(null, user);
})

passport.deserializeUser((obj, done)=>{
    console.log('Deserialized!')
    done(null, obj);
})

export default passport
