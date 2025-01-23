import { Router } from "express";
import { getAiResponse } from "../controllers/Ai.controller.js";
const aiRouter = Router();
aiRouter.get("/get-result", getAiResponse);


export default aiRouter; 