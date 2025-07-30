import express from 'express';
import { createCategory, deleteCategory, getACategory, getCategories, updateCategory } from '../controllers/categoryController';
import { authenticateUser } from '../middleware/authMiddleware';

const categoryRouter = express.Router();


categoryRouter.get('/list', getCategories)
categoryRouter.get('/:categoryId', authenticateUser, getACategory)
categoryRouter.post('/create', authenticateUser, createCategory)
categoryRouter.put('/:categoryId', authenticateUser, updateCategory)
categoryRouter.delete('/:categoryId', authenticateUser, deleteCategory)

export default categoryRouter;