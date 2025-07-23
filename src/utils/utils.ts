import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface UserPayload {
  id: number;
  role: string;
}

const secret_key = process.env.SECRET_KEY as string;

interface UserPayload {
  id: number;
  role: string;
}

const generateToken = (user: UserPayload) => {
  return jwt.sign({ data: user }, secret_key, { expiresIn: "1d" });
};

export default generateToken;
