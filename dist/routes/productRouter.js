"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const productController_1 = require("../controllers/productController");
const productRouter = express_1.default.Router();
productRouter.get("/list", productController_1.listProducts);
productRouter.get("/list-by-slug/:slug", productController_1.listProductsByCategoryORSubCategorySlug);
productRouter.get("/get-by-slug/:slug", productController_1.getAProductBySlug);
productRouter.post("/create", authMiddleware_1.authenticateUser, productController_1.createProduct);
productRouter.put("/:productId", authMiddleware_1.authenticateUser, productController_1.updateProduct);
productRouter.delete("/soft-delete/:productId", authMiddleware_1.authenticateUser, productController_1.softDeleteAProduct);
productRouter.delete("/:productId", authMiddleware_1.authenticateUser, productController_1.deleteAProductPermanently);
exports.default = productRouter;
//# sourceMappingURL=productRouter.js.map