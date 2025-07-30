import { Request, Response } from "express";
import { db } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await db.category.findMany({
         include: {
            subCategories: true,
            products: true
         }
        });
        return res.status(200).json({
          status: "success",
          message: "Categories retrieved successfully",
          categories,
        });
      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
}

export const getACategory = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
const {id} = user;
  if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  const categoryId =  req.params.categoryId ? parseInt(req.params.categoryId) : undefined;

  try {
    const user = await db.user.findUnique({ where: { id: id } });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const category = await db.category.findUnique({
        where: { id: categoryId },
      include: {
        subCategories: true,
        products: true
        }
    });

    return res.status(200).json({
      status: "success",
      message: "Category fetched successfully",
      category: category
    });
  } catch (error) {
    console.error("Error fetching category", error)
    return res.status(500).json({
        status: "error",
      message: "Internal server error",
    });
  }
}

export const createCategory = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const {id, role} = user;

  const { categoryName, slug, link } = req.body;
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

    const newCategory = await db.category.create({
      data: {
        categoryName,
        slug,
        link
      }
    })

    return res.status(201).json({
      status: "success",
      message: "Category created successfully",
      category: {
        id: newCategory.id,
        categoryName: newCategory.categoryName,
        slug: newCategory.slug,
        link
      },
    });
  } catch (error) {
    console.error("Error creating category", error)
    return res.status(500).json({
        status: "error",
        message: "Internal server error",
    });
  }
}

export const updateCategory = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const {id, role} = user;
  const { categoryId } = req.params;

  const { categoryName, slug, link } = req.body;
  if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  if (role != "ADMIN") {
    return res.status(401).json({ status: "error", message: "Login user is not admin" });
  }

  if (!categoryId) {
    return res.status(400).json({
      status: "error",
      message: "Category id is missing"
    })
  }

  try {
    const user = await db.user.findUnique({ where: { id: id } });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const existingCategory = await db.category.findUnique({ where: {id: parseInt(categoryId)}})

    if (!existingCategory) {
      return res.status(400).json({
        status: "error",
        message: "Category is not found"
      })
    }

    await db.category.update({
      where: {id: parseInt(categoryId)},
      data: {
        categoryName,
        slug,
        link
      }
    })

    return res.status(201).json({
      status: "success",
      message: "Category created successfully",
      category: existingCategory
    });
  } catch (error) {
    console.error("Error updating category", error)
    return res.status(500).json({
        status: "error",
      message: "Internal server error",
    });
  }
}

export const deleteCategory = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const {id, role} = user;
  const { categoryId } = req.params;


  if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  if (role != "ADMIN") {
    return res.status(401).json({ status: "error", message: "Login user is not admin" });
  }

  if (!categoryId) {
    return res.status(400).json({
      status: "error",
      message: "Category id is missing"
    })
  }

  try {
    const user = await db.user.findUnique({ where: { id: id } });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const existingCategory = await db.category.findUnique({where: {id: parseInt(categoryId)}})
    if (!existingCategory) {
      return res.status(400).json({
        status: "error",
        message: "Category id is missing"
      })
    }

    await db.category.delete({
      where: { id: parseInt(categoryId)}
    })

    return res.status(200).json({
      status: "success",
      message: "Category deleted successfully",
    });

  } catch (error) {
    console.error("Error updating category", error)
    return res.status(500).json({
        status: "error",
        message: "Internal server error",
    });
  }
}