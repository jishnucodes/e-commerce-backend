import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { createCoupon, deleteCoupon, getCouponById, getCoupons, updateCoupon } from '../controllers/couponController';

const couponRouter = express.Router();

couponRouter.get('/list', authenticateUser, getCoupons);
couponRouter.get('/:couponId', authenticateUser, getCouponById);
couponRouter.post('/create', authenticateUser, createCoupon)
couponRouter.put('/:couponId', authenticateUser, updateCoupon)
couponRouter.delete('/:couponId', authenticateUser, deleteCoupon)



export default couponRouter;