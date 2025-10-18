import express from 'express';
const router = express.Router();

import userRouter from './userRouter';
import brandRouter from './brandRouter';

import categoryRouter from './categoryRouter';
import subCategoryRouter from './subCategoryRouter';
import productRouter from './productRouter';
import reviewRouter from './reviewRouter';
import couponRouter from './couponRouter';
import orderRouter from './orderRouter';


router.use('/user', userRouter)
router.use('/brand',brandRouter)
router.use('/category', categoryRouter)
router.use('/subCategory', subCategoryRouter)
router.use('/product', productRouter)
router.use('/review', reviewRouter)
router.use('/coupon', couponRouter)
router.use('/orders', orderRouter)

export default router;