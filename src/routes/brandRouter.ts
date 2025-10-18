import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { createBrand, deleteBrand, getBrand, getBrands, updateBrand } from '../controllers/brandController';
const brandRouter = express.Router();

brandRouter.get('/list', getBrands);
brandRouter.get('/:brandId', authenticateUser, getBrand);
brandRouter.post('/create', authenticateUser, createBrand)
brandRouter.put('/:brandId', authenticateUser, updateBrand)
brandRouter.delete('/:brandId', authenticateUser, deleteBrand)



export default brandRouter;