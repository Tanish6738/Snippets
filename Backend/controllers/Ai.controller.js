import { generateResult } from "../Config/Ai.js";

export const getAiResponse = async (req, res) => {

    try {
        const { prompt } = req.query;
        const result = await generateResult(prompt);
        return res.status(200).json({ result });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const explainCode = async (req, res) => {
    try {
        const { code, language } = req.body;
        
        if (!code) {
            return res.status(400).json({ message: "Code is required" });
        }

        const prompt = `Please explain this ${language || ''} code:\n\n${code}`;
        const result = await generateResult(prompt);
        
        // Parse the AI response
        const explanation = JSON.parse(result);
        
        return res.status(200).json({
            success: true,
            explanation: {
                summary: explanation.text,
                details: explanation.fileTree.snippet.file
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};