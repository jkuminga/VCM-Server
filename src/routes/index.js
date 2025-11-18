import express from 'express';
import authRoutes from './auth.js';
import projectRoutes from './projects.js';
import userRoutes from './user.js';

const router = express.Router();

router.get('/', (req, res) => res.render('home', { user : req.user}));
router.get('/statistics', (req, res)=>{
    res.render('statistics');
})

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/user', userRoutes);

export default router;
