import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { createProduct, deleteAProductPermanently, getAProduct, listProducts, softDeleteAProduct, updateProduct } from '../controllers/productController';

const productRouter = express.Router();

productRouter.get("/list", listProducts);
productRouter.get("/:productId", authenticateUser, getAProduct);
productRouter.post("/create", authenticateUser, createProduct);
productRouter.put("/:productId", authenticateUser, updateProduct)
productRouter.delete("/soft-delete/:productId", authenticateUser, softDeleteAProduct)
productRouter.delete("/:productId", authenticateUser, deleteAProductPermanently)





export default productRouter;