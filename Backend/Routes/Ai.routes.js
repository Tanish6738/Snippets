import { Router } from "express";
import { getAiResponse, explainCode } from "../controllers/Ai.controller.js";
const aiRouter = Router();

aiRouter.get("/get-result", getAiResponse);
aiRouter.post("/explain-code", explainCode);

export default aiRouter;