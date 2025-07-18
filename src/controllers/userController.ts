
import { Request, Response } from "express";
import { db } from "../lib/prisma";
import bcrypt from "bcrypt";

export const userSignup = async (req: Request, res: Response) => {
  const { userName, email, password } = req.body;

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await db.user.create({
    data: {
    userName,
    email,
    hashedPassword,      
  },
});


    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      user: {
        id: newUser.id,
        userName: newUser.userName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
