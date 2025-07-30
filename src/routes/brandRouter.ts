import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { getBrand, getBrands } from '../controllers/brandController';
const brandRouter = express.Router();

brandRouter.get('brands/', getBrands);
brandRouter.get('brand/:id', authenticateUser, getBrand);



export default brandRouter;