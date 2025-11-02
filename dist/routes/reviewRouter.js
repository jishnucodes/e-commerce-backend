"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const reviewController_1 = require("../controllers/reviewController");
const reviewRouter = express_1.default.Router();
reviewRouter.get('/list/:productId', authMiddleware_1.authenticateUser, reviewController_1.getReviewsOfAProduct);
reviewRouter.post('/create', authMiddleware_1.authenticateUser, reviewController_1.createReview);
reviewRouter.put('/update/:reviewId', authMiddleware_1.authenticateUser, reviewController_1.updateReview);
reviewRouter.delete('/delete/:reviewId', authMiddleware_1.authenticateUser, reviewController_1.deleteAReview);
exports.default = reviewRouter;
//# sourceMappingURL=reviewRouter.js.map