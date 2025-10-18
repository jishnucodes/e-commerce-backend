import express from 'express';
import { forgotPassword, getAllUsers, getUser, logout, refreshToken, resetPassword, updatePassword, userLogin, userSignup, verifyOtp } from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';
const userRouter = express.Router();


userRouter.post('/signup', userSignup)
userRouter.post('/signin', userLogin)
userRouter.post('/refreshToken', authenticateUser, refreshToken);
userRouter.put('/updatePassword', authenticateUser,updatePassword);
userRouter.put('/forgotPassword',forgotPassword);
userRouter.post('/verifyOtp', verifyOtp);
userRouter.put('/resetPassword', resetPassword);
userRouter.get('/getUser/:userId',authenticateUser,getUser);
userRouter.get('/getAllUser',getAllUsers);
userRouter.post('/logout', authenticateUser, logout)


export default userRouter;