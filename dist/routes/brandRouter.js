"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const brandController_1 = require("../controllers/brandController");
const brandRouter = express_1.default.Router();
brandRouter.get('/list', brandController_1.getBrands);
brandRouter.get('/:brandId', authMiddleware_1.authenticateUser, brandController_1.getBrand);
brandRouter.post('/create', authMiddleware_1.authenticateUser, brandController_1.createBrand);
brandRouter.put('/:brandId', authMiddleware_1.authenticateUser, brandController_1.updateBrand);
brandRouter.delete('/:brandId', authMiddleware_1.authenticateUser, brandController_1.deleteBrand);
exports.default = brandRouter;
