import express from 'express';
import pool from '../config/db';

const router = express.Router();

// 대시보드 홈화면 : 프로젝트 목록 
router.get('/:pageNo', async (req, res, next)=>{

});

// 프로젝트 세부정보 화면
router.get('/:id/detail', (req, res)=>{

})

// 프로젝트 세부정보 화면 - 트랜잭션
router.get('/:id/credit', (req, res)=>{

})

// 프로젝트 고급 검색
router.post('/')

// 프로젝트 등록 하기
router.post('/new', (req, res)=>{
    
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
