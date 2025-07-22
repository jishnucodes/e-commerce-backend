import express from 'express';
import { getBrand } from '../controllers/brandController';
import { authenticateUser } from '../middleware/authMiddleware';
const brandRouter = express.Router();

brandRouter.get('getBrand/:brandId', authenticateUser,getBrand);

export default brandRouter;

