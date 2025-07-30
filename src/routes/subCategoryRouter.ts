import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { createSubCategory, deleteSubCategory, getASubCategory, getSubCategories, listSubCategoriesByCategoryId, updateSubCategory } from '../controllers/subCategoryController';

const subCategoryRouter = express.Router();


subCategoryRouter.get('/list', getSubCategories)
subCategoryRouter.get('/:subCategoryId', authenticateUser, getASubCategory)
subCategoryRouter.post('/create', authenticateUser, createSubCategory)
subCategoryRouter.put('/:subCategoryId', authenticateUser, updateSubCategory)
subCategoryRouter.delete('/:subCategoryId', authenticateUser, deleteSubCategory)
subCategoryRouter.get('/list/:categoryId', listSubCategoriesByCategoryId)

export default subCategoryRouter;