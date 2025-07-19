import express from 'express';
import { forgotPassword, getAllUsers, getUser, updatePassword, userLogin, userSignup } from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';
const userRouter = express.Router();


userRouter.post('/signup', userSignup)
userRouter.post('/signin', userLogin)
userRouter.put('/updatePassword', authenticateUser,updatePassword);
userRouter.put('/forgotPassword',forgotPassword);
userRouter.get('/getUser/:userId',authenticateUser,getUser);
userRouter.get('/getAllUser',getAllUsers);


export default userRouter;