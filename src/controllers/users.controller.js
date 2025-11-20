import pool from "../config/db.js";
import { logWithTimestamp, errorWithTimestamp } from "../utils/logger.js";

export default {
    getUserInfo : (req,res)=>{
        if(!req.user){
            logWithTimestamp('🛑[401 Unauthorized]-로그인 된 사용자 없음');
            return res.status(401).render('401');
        }
    
        logWithTimestamp('✅ 사용자 정보 불러오기 완료')
        res.status(200).json(req.user);
        // return res.status(200).render('mypage', {user:req.user});
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

            // res.status(200).render('myprojects', {data : rows, user : req.user });

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
