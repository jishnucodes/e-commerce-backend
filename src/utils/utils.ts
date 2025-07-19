import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret_key = process.env.SECRET_KEY as string;

const generateToken = (userId: number) => {
  return jwt.sign({ data: userId }, secret_key, { expiresIn: "1d" });
};

export default generateToken;