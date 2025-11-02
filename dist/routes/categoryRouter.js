"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../controllers/categoryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const categoryRouter = express_1.default.Router();
categoryRouter.get('/list', categoryController_1.getCategories);
categoryRouter.get('/:categoryId', authMiddleware_1.authenticateUser, categoryController_1.getACategory);
categoryRouter.post('/create', authMiddleware_1.authenticateUser, categoryController_1.createCategory);
categoryRouter.put('/:categoryId', authMiddleware_1.authenticateUser, categoryController_1.updateCategory);
categoryRouter.delete('/:categoryId', authMiddleware_1.authenticateUser, categoryController_1.deleteCategory);
exports.default = categoryRouter;
