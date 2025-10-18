import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { createReview, deleteAReview, getReviewsOfAProduct, updateReview } from '../controllers/reviewController';


const reviewRouter = express.Router();

reviewRouter.get('/list/:productId', authenticateUser, getReviewsOfAProduct)
reviewRouter.post('/create', authenticateUser, createReview);
reviewRouter.put('/update/:reviewId', authenticateUser, updateReview)
reviewRouter.delete('/delete/:reviewId', authenticateUser, deleteAReview)

export default reviewRouter;