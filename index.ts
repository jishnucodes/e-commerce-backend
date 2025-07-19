import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import router from './src/routes';
import cookieParser from "cookie-parser";
import { serve } from "inngest/express";
import { inngest, functions } from "./src/inngest"




dotenv.config();
const app = express()
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api", router);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
