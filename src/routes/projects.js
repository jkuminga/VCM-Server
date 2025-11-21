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

// 프로젝트 등록 하기
router.post('/new', (req, res)=>{
    projectsController.addNewProject(req, res);
})

// 프로젝트 수정 하기
router.patch('/:id', (req, res)=>{
    projectsController.editProject(req,res);
})

// 프로젝트 삭제 하기
router.delete('/:id', (req, res)=>{
    projectsController.deleteProject(req, res);
})


export default router;