"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubCategory = exports.updateSubCategory = exports.createSubCategory = exports.listSubCategoriesByCategoryId = exports.getASubCategory = exports.getSubCategories = void 0;
const prisma_1 = require("../lib/prisma");
const getSubCategories = async (req, res) => {
    try {
        const subCategories = await prisma_1.db.subCategory.findMany({
            include: {
                category: true
            }
        });
        return res.status(200).json({
            status: true,
            message: "Sub categories retrieved successfully",
            data: subCategories,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.getSubCategories = getSubCategories;
const getASubCategory = async (req, res) => {
    const { user } = req;
    const { id } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    const subCategoryId = req.params.subCategoryId ? parseInt(req.params.subCategoryId) : undefined;
    if (!subCategoryId) {
        return res.status(400).json({ status: false, message: "Invalid subcategory id" });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res
                .status(404)
                .json({ status: false, message: "User not found" });
        }
        const subCategory = await prisma_1.db.subCategory.findUnique({
            where: {
                id: subCategoryId
            }
        });
        return res.status(200).json({
            status: true,
            message: "Sub category fetched successfully",
            data: subCategory
        });
    }
    catch (error) {
        console.error("Error fetching category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.getASubCategory = getASubCategory;
const listSubCategoriesByCategoryId = async (req, res) => {
    // const { user } = req as AuthenticatedRequest;
    // const {id} = user;
    // if (!id) {
    //     return res.status(401).json({ status: "error", message: "Unauthorized" });
    // }
    const categoryId = req.params.categoryId ? parseInt(req.params.categoryId) : undefined;
    if (!categoryId) {
        return res.status(400).json({ status: false, message: "Invalid category id" });
    }
    try {
        // const user = await db.user.findUnique({ where: { id: id } });
        // if (!user) {
        //     return res
        //         .status(404)
        //         .json({ status: "error", message: "User not found" });
        // }
        const category = await prisma_1.db.category.findUnique({
            where: {
                id: categoryId
            }
        });
        if (!category) {
            return res.status(400).json({
                status: false,
                message: "Category not found"
            });
        }
        const subCategory = await prisma_1.db.subCategory.findMany({
            where: {
                categoryId
            }
        });
        if (!subCategory) {
            return res.status(400).json({
                status: false,
                message: "No sub categories found for this category"
            });
        }
        return res.status(200).json({
            status: true,
            message: "Sub category fetched successfully",
            data: subCategory
        });
    }
    catch (error) {
        console.error("Error fetching category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.listSubCategoriesByCategoryId = listSubCategoriesByCategoryId;
const createSubCategory = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { subCategoryName, slug, categoryId } = req.body;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role != "ADMIN") {
        return res.status(401).json({ status: false, message: "Login user is not admin" });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res
                .status(404)
                .json({ status: false, message: "User not found" });
        }
        const category = await prisma_1.db.category.findUnique({
            where: {
                id: categoryId
            }
        });
        if (!category) {
            return res.status(400).json({
                status: false,
                message: "Category not found"
            });
        }
        const newSubCategory = await prisma_1.db.subCategory.create({
            data: {
                subCategoryName,
                slug,
                categoryId,
                createdBy: id,
                modifiedBy: id
            }
        });
        if (!newSubCategory) {
            return res.status(400).json({
                status: false,
                message: "Sub category not created"
            });
        }
        return res.status(201).json({
            status: true,
            message: "Sub category created successfully",
            data: newSubCategory
        });
    }
    catch (error) {
        console.error("Error creating sub category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.createSubCategory = createSubCategory;
const updateSubCategory = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { subCategoryName, slug, categoryId } = req.body;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role != "ADMIN") {
        return res.status(401).json({ status: false, message: "Login user is not admin" });
    }
    const subCategoryId = req.params.subCategoryId ? parseInt(req.params.subCategoryId) : undefined;
    if (!subCategoryId) {
        return res.status(400).json({ status: false, message: "Invalid subcategory id" });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res
                .status(404)
                .json({ status: false, message: "User not found" });
        }
        const existingSubCategory = await prisma_1.db.subCategory.findUnique({
            where: {
                id: subCategoryId
            }
        });
        if (!existingSubCategory) {
            return res.status(400).json({
                status: false,
                message: "Sub category is not found"
            });
        }
        const category = await prisma_1.db.category.findUnique({
            where: {
                id: categoryId
            }
        });
        if (!category) {
            return res.status(400).json({
                status: false,
                message: "Category not found"
            });
        }
        const updatedCategory = await prisma_1.db.subCategory.update({
            where: {
                id: subCategoryId
            },
            data: {
                subCategoryName,
                slug,
                categoryId,
                modifiedBy: id
            }
        });
        return res.status(201).json({
            status: true,
            message: "Sub category updated successfully",
            data: updatedCategory
        });
    }
    catch (error) {
        console.error("Error updating sub category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.updateSubCategory = updateSubCategory;
const deleteSubCategory = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { subCategoryId } = req.params;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role != "ADMIN") {
        return res.status(401).json({ status: false, message: "Login user is not admin" });
    }
    if (!subCategoryId) {
        return res.status(400).json({
            status: false,
            message: "Sub category id is missing"
        });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res
                .status(404)
                .json({ status: false, message: "User not found" });
        }
        const existingSubCategory = await prisma_1.db.subCategory.findUnique({
            where: {
                id: parseInt(subCategoryId)
            }
        });
        if (!existingSubCategory) {
            return res.status(400).json({
                status: false,
                message: "Sub category is not found"
            });
        }
        await prisma_1.db.subCategory.delete({
            where: { id: parseInt(subCategoryId) }
        });
        return res.status(200).json({
            status: true,
            message: "Sub category deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting sub category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.deleteSubCategory = deleteSubCategory;
