import pool from "../config/db.js";
import { logWithTimestamp, errorWithTimestamp } from "../utils/logger.js";

export default {
    signup :  async (req, res, next)=>{
        if(!req.session.signupProfile){
        return res.redirect('/')
    }

    const {name, email, role} = req.body;

    if(!role) { 
        return res.status(400).send('회원유형을 선택해주세요!');
    }

    try{
        const pendingProfile = req.session.signupProfile;
        const newUser = {
            google_id: pendingProfile.id,
            displayName: name,
            email,
            role,
            provider: pendingProfile.provider,
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
    },

    getUserInfo : (req,res)=>{
        if(!req.user) {
            errorWithTimestamp('❌[401 UnAuthorized] 로그인 된 사용자 정보 반환 실패');
            return res.status(401).json({
                "code": 401,
                "status": "Unauthorized",
                "message": "Unauthorized",
            })
        }

        logWithTimestamp('✅로그인 된 사용자 정보 반환 성공');
        return res.status(200).json(req.user);
    },

    getUsersProjectsList : async (req, res)=>{
        const user = req.user;
        if(!user){
            logWithTimestamp('🛑[401 Unauthorized]-로그인 된 사용자 없음');
            return res.status(401).render('401');
        }
        const userId = user.user_id;

        try{
            const [rows] = await pool.query('SELECT * FROM projects WHERE user_id = ?', [userId]);

            console.log(rows);

            logWithTimestamp('✅ 사용자 프로젝트 불러오기 성공')

            const response = {
                user: req.user,
                data : rows
            }

            console.log(response);
            
            res.status(200).json(response);
        }catch(error){
            errorWithTimestamp(`❌ 사용자 프로젝트 불러오기 실패`, error);
            res.status(500).json({
                "code": 500,
                "status": "Internal Server Error",
                "message": "사용자 프로젝트 불러오기 실패 ",
                "error" : error
            })
        }

    }
};
