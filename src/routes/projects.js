import express from 'express';
import projectsController from '../controllers/projects.controller.js';

const router = express.Router();

// 대시보드 홈화면 : 프로젝트 목록 
router.get('/:pageNo', async (req, res, next)=>{
    projectsController.getProjectListsByPageNo(req, res);
});

// 프로젝트 세부정보 화면
router.get('/:id/detail', (req, res)=>{
    projectsController.getProjectsDetail(req, res);
})

// 프로젝트 세부정보 화면 - 트랜잭션
router.get('/:id/credit', (req, res)=>{
    projectsController.getProjectTransactionData(req, res);
})

// 프로젝트 고급 검색
router.post('/search/:pageNo', (req,res)=>{
    projectsController.searchProject(req, res);
})

// 프로젝트 등록 화면
// TODO : 프론트 연동 시 삭제
router.get('/new/form', (req, res)=>{
    if(!req.user){
        console.log('Login Please');
        return res.status(401).render('401');
    }

    return res.status(200).render('project-form', {isEdit : false})
})

// 프로젝트 등록 하기
router.post('/new', (req, res)=>{
    projectsController.addNewProject(req, res);
})

router.get('/:id/edit',(req,res)=>{
    // 1. 데이터 쿼리해서 ejs로 전송
    // 2. ejs로 전송
})

// 프로젝트 수정 하기
router.patch('/:id', (req, res)=>{
    // 폼 오류 시 에러 전송 생성
})

// 프로젝트 삭제 하기
router.delete('/:id', (req, res)=>{
    // 폼 오류 시 에러 전송 생성
})
export default router;
// 