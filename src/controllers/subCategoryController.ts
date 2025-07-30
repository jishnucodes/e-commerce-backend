import { Request, Response } from "express";
import { db } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";


export const getSubCategories = async (req: Request, res: Response) => {
    try {
        const subCategories = await db.subCategory.findMany();

        return res.status(200).json({
            status: "success",
            message: "Sub categories retrieved successfully",
            subCategories,
        })
    } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
    }
}

export const getASubCategory = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const {id} = user;
    if (!id) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    const subCategoryId =  req.params.subCategoryId ? parseInt(req.params.subCategoryId) : undefined;
    if (!subCategoryId) {
        return res.status(400).json({status: "error", message: "Invalid subcategory id"})
    }
    try {
        const user = await db.user.findUnique({ where: { id: id } });

        if (!user) {
            return res
            .status(404)
            .json({ status: "error", message: "User not found" });
        }

        const subCategory = await db.subCategory.findUnique({
            where: {
                id: subCategoryId
            }
        })

        return res.status(200).json({
            status: "success",
            message: "Sub category fetched successfully",
            subCategory
        });
    } catch (error) {
        console.error("Error fetching category", error)
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

export const listSubCategoriesByCategoryId = async (req: Request, res: Response) => {
    // const { user } = req as AuthenticatedRequest;
    // const {id} = user;
    // if (!id) {
    //     return res.status(401).json({ status: "error", message: "Unauthorized" });
    // }
    const categoryId =  req.params.categoryId ? parseInt(req.params.categoryId) : undefined;
    if (!categoryId) {
        return res.status(400).json({status: "error", message: "Invalid category id"})
    }

    try {
        // const user = await db.user.findUnique({ where: { id: id } });

        // if (!user) {
        //     return res
        //         .status(404)
        //         .json({ status: "error", message: "User not found" });
        // }

        const category = await db.category.findUnique({
            where: {
                id: categoryId
            }
        })

        if (!category) {
            return res.status(400).json({
                status: "error",
                message: "Category not found"
            })
        }

        const subCategory = await db.subCategory.findMany({
            where: {
                categoryId
            }
        })

        if (!subCategory) {
            return res.status(400).json({
                status: "error",
                message: "No sub categories found for this category"
            })
        }

        return res.status(200).json({
            status: "success",
            message: "Sub category fetched successfully",
            subCategory
        })
    } catch (error) {
        console.error("Error fetching category", error)
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

export const createSubCategory = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const {id, role} = user;

    const { subCategoryName, slug, categoryId } = req.body;
    if (!id) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (role != "ADMIN") {
        return res.status(401).json({ status: "error", message: "Login user is not admin" });
    }

    try {
        const user = await db.user.findUnique({ where: { id: id } });

        if (!user) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }

        const category = await db.category.findUnique({
            where: {
                id: categoryId
            }
        })

        if (!category) {
            return res.status(400).json({
                status: "error",
                message: "Category not found"
            })
        }

        const newSubCategory = await db.subCategory.create({
            data: {
                subCategoryName,
                slug,
                categoryId,
                createdBy: id,
                modifiedBy: id
            }
        })

        if (!newSubCategory) {
            return res.status(400).json({
                status: "error",
                message: "Sub category not created"
            })
        }

        return res.status(201).json({
            status: "success",
            message: "Sub category created successfully",
            subCategory: newSubCategory
        });

    } catch (error) {
        console.error("Error creating sub category", error)
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

export const updateSubCategory = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const {id, role} = user;

    const { subCategoryName, slug, categoryId } = req.body;
    if (!id) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (role != "ADMIN") {
        return res.status(401).json({ status: "error", message: "Login user is not admin" });
    }

    const subCategoryId =  req.params.subCategoryId ? parseInt(req.params.subCategoryId) : undefined;
    if (!subCategoryId) {
        return res.status(400).json({status: "error", message: "Invalid subcategory id"})
    }

    try {
        const user = await db.user.findUnique({ where: { id: id } });

        if (!user) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }

        const existingSubCategory = await db.subCategory.findUnique({
            where: {
                id: subCategoryId
            }
        })

        if (!existingSubCategory) {
            return res.status(400).json({
                status: "error",
                message: "Sub category is not found"
            })
        }

        const category = await db.category.findUnique({
            where: {
                id: categoryId
            }
        })

        if (!category) {
            return res.status(400).json({
                status: "error",
                message: "Category not found"
            })
        }

        const updatedCategory = await db.subCategory.update({
            where: {
                id: subCategoryId
            },
            data: {
                subCategoryName,
                slug,
                categoryId,
                modifiedBy: id
            }
        })

        return res.status(201).json({
            status: "success",
            message: "Sub category updated successfully",
            subCategory: updatedCategory
        });
    } catch (error) {
        console.error("Error updating sub category", error)
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

export const deleteSubCategory = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const {id, role} = user;
    const { subCategoryId } = req.params;


    if (!id) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (role != "ADMIN") {
        return res.status(401).json({ status: "error", message: "Login user is not admin" });
    }

    if (!subCategoryId) {
        return res.status(400).json({
            status: "error",
            message: "Sub category id is missing"
        })
    }

    try {
        const user = await db.user.findUnique({ where: { id: id } });

        if (!user) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }

        const existingSubCategory = await db.subCategory.findUnique({
            where: {
                id: parseInt(subCategoryId)
            }
        })

        if (!existingSubCategory) {
            return res.status(400).json({
                status: "error",
                message: "Sub category is not found"
            })
        }

        await db.subCategory.delete({
            where: { id: parseInt(subCategoryId)}
        })
        
        return res.status(200).json({
            status: "success",
            message: "Sub category deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting sub category", error)
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}