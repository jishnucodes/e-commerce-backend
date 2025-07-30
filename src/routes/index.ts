import express from 'express';
const router = express.Router();

import userRouter from './userRouter';
import categoryRouter from './categoryRouter';
import subCategoryRouter from './subCategoryRouter';


router.use('/user', userRouter)
router.use('/category', categoryRouter)
router.use('/subCategory', subCategoryRouter)

export default router;