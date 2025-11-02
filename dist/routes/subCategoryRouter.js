"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const subCategoryController_1 = require("../controllers/subCategoryController");
const subCategoryRouter = express_1.default.Router();
subCategoryRouter.get('/list', subCategoryController_1.getSubCategories);
subCategoryRouter.get('/:subCategoryId', authMiddleware_1.authenticateUser, subCategoryController_1.getASubCategory);
subCategoryRouter.post('/create', authMiddleware_1.authenticateUser, subCategoryController_1.createSubCategory);
subCategoryRouter.put('/:subCategoryId', authMiddleware_1.authenticateUser, subCategoryController_1.updateSubCategory);
subCategoryRouter.delete('/:subCategoryId', authMiddleware_1.authenticateUser, subCategoryController_1.deleteSubCategory);
subCategoryRouter.get('/list/:categoryId', subCategoryController_1.listSubCategoriesByCategoryId);
exports.default = subCategoryRouter;
