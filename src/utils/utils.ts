import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret_key = process.env.SECRET_KEY as string;

interface UserPayload {
  id: number;
  role: string;
}

const generateToken = (user: UserPayload, expiresIn: SignOptions["expiresIn"]): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign({ data: user }, secret_key, options);
};


export default generateToken;
