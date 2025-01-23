import { generateResult } from "../Config/Ai.js";

export const getAiResponse = async (req, res) => {

    try {
        const { prompt } = req.query;
        const result = await generateResult(prompt);
        return res.status(200).json({ result });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
} 