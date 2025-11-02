"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getACategory = exports.getCategories = void 0;
const prisma_1 = require("../lib/prisma");
const getCategories = async (req, res) => {
    try {
        const categories = await prisma_1.db.category.findMany({
            include: {
                subCategories: {
                    select: {
                        id: true,
                        subCategoryName: true,
                        slug: true,
                    }
                }
            },
        });
        return res.status(200).json({
            status: true,
            message: "Categories retrieved successfully",
            data: categories,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.getCategories = getCategories;
const getACategory = async (req, res) => {
    const { user } = req;
    const { id } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    const categoryId = req.params.categoryId
        ? parseInt(req.params.categoryId)
        : undefined;
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const category = await prisma_1.db.category.findUnique({
            where: { id: categoryId },
            // include: {
            //   subCategories: true,
            //   products: true,
            // },
        });
        return res.status(200).json({
            status: true,
            message: "Category fetched successfully",
            data: category,
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
exports.getACategory = getACategory;
const createCategory = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { categoryName, slug, link } = req.body;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role != "ADMIN") {
        return res
            .status(401)
            .json({ status: false, message: "Login user is not admin" });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const newCategory = await prisma_1.db.category.create({
            data: {
                categoryName,
                slug,
                link,
            },
        });
        return res.status(201).json({
            status: true,
            message: "Category created successfully",
            data: {
                id: newCategory.id,
                categoryName: newCategory.categoryName,
                slug: newCategory.slug,
                link,
            },
        });
    }
    catch (error) {
        console.error("Error creating category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { categoryId } = req.params;
    const { categoryName, slug, link } = req.body;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role != "ADMIN") {
        return res
            .status(401)
            .json({ status: false, message: "Login user is not admin" });
    }
    if (!categoryId) {
        return res.status(400).json({
            status: false,
            message: "Category id is missing",
        });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const existingCategory = await prisma_1.db.category.findUnique({
            where: { id: parseInt(categoryId) },
        });
        if (!existingCategory) {
            return res.status(400).json({
                status: false,
                message: "Category is not found",
            });
        }
        await prisma_1.db.category.update({
            where: { id: parseInt(categoryId) },
            data: {
                categoryName,
                slug,
                link,
            },
        });
        return res.status(200).json({
            status: true,
            message: "Category updated successfully",
            data: existingCategory,
        });
    }
    catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { categoryId } = req.params;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role != "ADMIN") {
        return res
            .status(401)
            .json({ status: false, message: "Login user is not admin" });
    }
    if (!categoryId) {
        return res.status(400).json({
            status: false,
            message: "Category id is missing",
        });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const existingCategory = await prisma_1.db.category.findUnique({
            where: { id: parseInt(categoryId) },
        });
        if (!existingCategory) {
            return res.status(400).json({
                status: false,
                message: "Category id is missing",
            });
        }
        await prisma_1.db.subCategory.deleteMany({
            where: { categoryId: parseInt(categoryId) }
        });
        await prisma_1.db.category.delete({
            where: { id: parseInt(categoryId) },
        });
        return res.status(200).json({
            status: true,
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.deleteCategory = deleteCategory;
