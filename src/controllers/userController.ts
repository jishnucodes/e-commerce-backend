
import { Request, Response } from "express";
import { db } from "../lib/prisma";
import bcrypt from "bcrypt";
import generateToken from "../utils/utils";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

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
    userType: "USER", // Default user type
    role: "USER", // Default role      
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

export const userLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid password",
      });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only over HTTPS in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        userType: user.userType,
        role: user.role,   
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

export const updatePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  try {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isPasswordCorrect) {
      return res.status(400).json({ status: "error", message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: userId },
      data: { hashedPassword: hashedNewPassword },
    });

    return res.status(200).json({ status: "success", message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const forgotPassword = async ( req: Request, res: Response)=>{
 
  const {email,password}=req.body;
  try{
    const user = await db.user.findUnique({where:{email}});
    if(!user){
      return res.status(404).json({
        status:"error",
      message:"user not found"})
    }
    const hashedPassword =await bcrypt.hash(password,10);
    await db.user.update({
      where: {email},
      data: {hashedPassword}
    })
    return res.status(200).json({
      status:"success",
      message:"Password updated successfully"
    })
  } catch(error){
    return res.status(500).json({
      status:"error",
      message:"internal server error"
    })
  }
}

export const getUser = async(req: AuthenticatedRequest,res: Response)=>{
  const userId= req.params.userId ? parseInt(req.params.userId) : req.userId;
  if(!userId){
    return res.status(401).json({
      status: "error",
      message:"Unauthorized"
    })
  }
  try{
    const user = await db.user.findUnique({
      where: {id: userId},
      select:{
        id:true,
        userName:true,
        email:true,
        userType:true,
        role:true,
      }
    })
    if(!user){
      return res.status(404).json({
        status:"error",
        message:"User not found"
      })
    }
    return res.status(200).json({
      status:"success",
      user
    })
  }
  catch(error){
    console.error("Get user error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
}

export const getAllUsers = async(req : Request, res: Response) =>{
  
  try{
    const users = await db.user.findMany({
      select:{
        id:true,
        userName:true,
        email:true,
        userType:true,
        role:true,
      }   
    })
    return res.status(200).json({
      status:"success",
      message:"Users retrieved successfully",
      users
    })
  }
  catch(error){
    return res.status(500).json({
      status:"error",
      message:"Internal server error"
    })
  }
}