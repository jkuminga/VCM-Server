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

// // 프로젝트 등록 하기
// router.post('/new', (req, res)=>{
//     projectsController.addNewProject(req, res);
// })

// 프로젝트 수정 하기
router.patch('/:id', (req, res)=>{
    projectsController.editProject(req,res);
})

// // 프로젝트 삭제 하기
// router.delete('/:id', (req, res)=>{
//     projectsController.deleteProject(req, res);
// })


// user_projects 관련 APi 목록

// 새로운 프로젝트 생성
router.post('/new', (req, res)=>{
    projectsController.addNewUserProject(req, res);
})
// 사용자 프로젝트 목록 반환
router.get('/waiting/:pageNo', (req, res)=>{
    projectsController.getUserProjectsList(req, res);
})
// 사용자 프로제그 세부정보 반환
router.get('/waiting/detail/:projectId', (req, res)=>{
    projectsController.getUserProjectDetail(req, res)
})
// 해당 프로젝트에 코멘트 달기
router.post('/waiting/:projectId/comment', (req, res)=>{
    projectsController.postComment(req, res);
})
// 해당 프로젝트에 공감 달기
router.post('/waiting/:projectId/reaction', (req, res)=>{
    projectsController.postReaction(req, res);
})
// 해당 프로젝트에 달린 현재 로그인 된 사용자의 공감 가져오기
router.get('/waiting/:projectId/reaction', (req, res)=>{
    projectsController.getReaction(req, res);
})
// 올린 프로젝트 수정하기
router.patch('/waiting/:projectId', (req, res)=>{
    projectsController.editUserProjectDetail(req,res);
})
// 해당 프로젝트의 댓글 목록 불러오기
router.get('/waiting/detail/:projectId/comments', (req, res)=>{
    projectsController.getComments(req, res)
})
// 해당 프로젝트 댓글 삭제하기
router.delete('/waiting/detail/:commentId/comment', (req, res)=>{
    projectsController.deleteComments(req,res);
})


export default router;