import express from 'express';
import { logWithTimestamp, errorWithTimestamp } from '../utils/logger.js';
import pool from '../config/db.js';

const router = express.Router();

// 등록 요청된 프로젝트 목록 확인
router.get('/list/:registry', async (req, res)=>{
    const registry = req.params.registry;
    const registries = ['ACR', 'ART', 'CAR', 'GLD', 'VCS'];

    try{
        const [rows] = await pool.query(
            'SELECT id, project_name, status, updated_at FROM user_projects WHERE registry = ? ORDER BY updated_at DESC',
            [registry]
        );

        logWithTimestamp('✅ 대기중인 프로젝트 목록 불러오기 완료');

        res.status(200).render('waiting-projects',{
            projects : rows,
            registry,
            registries
        });
    }catch(err){
        errorWithTimestamp(`❌ 대기중인 프로젝트 목록 불러오기 실패`, err);
        res.status(500).json({
            "code": 500,
            "status": "Internal Server Error",
            "message": "새로운 프로젝트 등록 실패 ",
            "error" : err
        })
    }
})


// 등록 요청된 프로젝트의 상태 변경
router.patch('/status', async (req, res)=>{
    const data = req.body;

    const listProjectId = data['project_id'];
    const status = data['status'];

    const allowedStatuses = ['waiting', 'approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
        errorWithTimestamp('❌ 잘못된 상태 수신');
        return res.status(400).json({ message: 'Invalid reaction' });
    }

    try{
        await pool.query('UPDATE user_projects SET status = ? WHERE id = ?', [status, listProjectId]);

        logWithTimestamp('✅ 프로젝트 상태 변경 완료');
        res.status(200).json({
            result : 'done'
        })
    }catch(err){
        errorWithTimestamp(`❌ 대기중인 프로젝트 상태 변경 실패`, err);
        res.status(500).json({
            "code": 500,
            "status": "Internal Server Error",
            "message": "대기중인 프로젝트 상태 변경 실패 ",
            "error" : err
        })
        
    }
})

// 동록된 프로젝트의 상세 내용 확인하기
router.get('/detail/:projectId', async (req ,res)=>{
    const projectId = parseInt(req.params.projectId);

    try{
        const [[project]] = await pool.query(
            `SELECT id, user_id, public_code, project_name, developer_name, registry, scope, type, country, description,
                    methodology, baseline_summary, monitoring_plan, additionality, status, created_at, updated_at
             FROM user_projects WHERE id = ?`,
            [projectId]
        );

        if (!project) {
            return res.status(404).render('404');
        }

        const registries = ['ACR', 'ART', 'CAR', 'GS', 'VCS'];
        const statuses = ['waiting', 'approved', 'rejected'];

        res.status(200).render('project-detail', { project, registries, statuses });
    }catch(err){
        errorWithTimestamp(`❌ 대기중인 프로젝트 세부정보 불러오기 실패`, err);
        res.status(500).json({
            "code": 500,
            "status": "Internal Server Error",
            "message": "대기중인 프로젝트 세부정보 불러오기 실패 ",
            "error" : err
        })
    }
})


export default router;
