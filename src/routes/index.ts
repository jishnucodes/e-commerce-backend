import express from 'express';
const router = express.Router();

import userRouter from './userRouter';
import brandRouter from './brandRouter';



router.use('/user', userRouter)
router.use('/brand',brandRouter)

export default router;