import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { generateResult } from '../Config/Ai.js';

// Load environment variables
dotenv.config();

// Initialize the Google Generative AI API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate Explanations for a given code snippet
export const generateExplanation = async (req, res) => {
    try {
        const { code, language } = req.body;

        // Validate input
        if (!code) {
            return res.status(400).json({ error: 'Code snippet is required' });
        }

        // Prepare the prompt
        const prompt = `
            You are a code expert. Please provide a detailed explanation of the following code snippet written in ${language || 'the appropriate programming language'}.
            
            Include:
            1. A summary of what the code does
            2. Explanation of key functions and logic
            3. Any potential issues or optimizations
            4. Suggested tags that would be relevant for this code
            
            Format your response as a JSON object with the following structure:
            {
                "title": "Brief title describing this code",
                "content": "Your detailed explanation",
                "tags": ["tag1", "tag2", "tag3"]
            }
            
            Only return the JSON object, nothing else.

            Here is the code:
            \`\`\`
            ${code}
            \`\`\`
        `;

        // Generate content using the imported function from Config/Ai.js
        const result = await generateResult(prompt);
        
        // Parse the JSON
        let data;
        try {
            data = JSON.parse(result);
        } catch (e) {
            console.error("Failed to parse response as JSON:", e);
            return res.status(500).json({ error: 'Failed to generate explanation' });
        }

        res.status(200).json({ success: true, explanation: data });
    } catch (error) {
        console.error("Error generating explanation:", error);
        res.status(500).json({ error: error.message || 'Failed to generate explanation' });
    }
};

// Generate a cheat sheet from multiple code snippets
export const generateCheatSheet = async (req, res) => {
    try {
        const { snippets, title, format, includeExplanations } = req.body;

        // Validate input
        if (!snippets || !Array.isArray(snippets) || snippets.length === 0) {
            return res.status(400).json({ error: 'At least one snippet is required' });
        }

        // Configure the model directly for this specific request to bypass JSON formatting
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the snippet data for the prompt
        const snippetsData = snippets.map(snippet => ({
            title: snippet.title,
            language: snippet.programmingLanguage,
            content: snippet.content,
            tags: snippet.tags || []
        }));

        // Prepare the prompt
        const prompt = `
            Create a comprehensive code cheat sheet titled "${title || 'Code Cheat Sheet'}" using the following code snippets.
            
            ${includeExplanations ? 'For each snippet, provide a brief explanation of what it does.' : 'Only include the code snippets with their titles.'}
            
            Format the output as ${format === 'html' ? 'HTML' : 'Markdown'}.
            
            Here are the snippets:
            ${JSON.stringify(snippetsData, null, 2)}
            
            ${format === 'html' ? 'The HTML should have proper styling with syntax highlighting and be well-organized.' : 'The Markdown should be properly formatted with code blocks and be well-organized.'}
            
            Include a table of contents at the beginning.
            
            Group snippets by language if there are multiple languages.
            
            ${includeExplanations ? 'For each snippet explanation, be concise but informative.' : ''}

            IMPORTANT: DO NOT respond with JSON. Respond with plain ${format === 'html' ? 'HTML' : 'Markdown'} content only.
        `;

        // Generate content directly with the model
        const result = await model.generateContent(prompt);
        const content = result.response.text();

        res.status(200).json({ 
            success: true, 
            cheatSheet: {
                title: title || 'Code Cheat Sheet',
                content: content,
                format,
                snippetCount: snippets.length
            } 
        });
    } catch (error) {
        console.error("Error generating cheat sheet:", error);
        res.status(500).json({ error: error.message || 'Failed to generate cheat sheet' });
    }
};

// Convert code from one language to another
export const convertCode = async (req, res) => {
    try {
        const { code, sourceLanguage, targetLanguage } = req.body;

        // Validate input
        if (!code) {
            return res.status(400).json({ error: 'Code snippet is required' });
        }
        if (!targetLanguage) {
            return res.status(400).json({ error: 'Target language is required' });
        }

        // Configure the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the prompt
        const prompt = `
            Convert the following ${sourceLanguage || 'code'} code to ${targetLanguage} code.
            
            Maintain the same functionality and logic, but use idiomatic patterns 
            and best practices for ${targetLanguage}.
            
            Add comments to explain complex or non-obvious parts.
            
            Format your response in two parts:
            1. First provide only the converted code, formatted with proper syntax highlighting
            2. Then provide a brief explanation of key changes or differences between the two languages
            
            The code to convert:
            \`\`\`${sourceLanguage || ''}
            ${code}
            \`\`\`
            
            Return only the converted code and explanation, nothing else.
        `;

        // Generate content
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        // Extract the code from the response
        let convertedCode = text;
        let explanation = '';
        
        // Attempt to separate the code from the explanation
        const codeSections = convertedCode.split(/```[a-zA-Z0-9]*\s*|```/);
        if (codeSections.length >= 3) {
            convertedCode = codeSections[1].trim();
            explanation = text.substring(text.lastIndexOf('```') + 3).trim();
        }

        res.status(200).json({ 
            success: true, 
            result: {
                originalCode: code,
                convertedCode,
                explanation,
                sourceLanguage: sourceLanguage || 'unknown',
                targetLanguage
            } 
        });
    } catch (error) {
        console.error("Error converting code:", error);
        res.status(500).json({ error: error.message || 'Failed to convert code' });
    }
};

// Generate documentation for a code snippet
export const generateDocumentation = async (req, res) => {
    try {
        const { code, language, style, level } = req.body;

        // Validate input
        if (!code) {
            return res.status(400).json({ error: 'Code snippet is required' });
        }

        // Configure the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Determine documentation style
        const docStyle = style || 'standard'; // Options: standard, jsdoc, javadoc, docstring, etc.
        const detailLevel = level || 'medium'; // Options: basic, medium, comprehensive

        // Prepare the prompt
        const prompt = `
            You are a documentation expert. Generate professional documentation for the following code snippet written in ${language || 'the appropriate programming language'}.
            
            Use the ${docStyle} documentation style with ${detailLevel} detail level.
            
            For ${detailLevel} detail level:
            ${detailLevel === 'basic' ? 'Focus only on the core functionality and main components.' : ''}
            ${detailLevel === 'medium' ? 'Include function descriptions, parameters, return values, and key concepts.' : ''}
            ${detailLevel === 'comprehensive' ? 'Provide extensive documentation with examples, edge cases, performance considerations, and detailed explanations of all components.' : ''}
            
            Format your response as a JSON object with the following structure:
            {
                "documentation": {
                    "overview": "Brief overview of the code",
                    "sections": [
                        {
                            "title": "Section title (e.g., function name, class name, etc.)",
                            "content": "Documentation content for this section",
                            "params": [{"name": "paramName", "description": "param description", "type": "param type"}],
                            "returns": {"description": "return description", "type": "return type"}
                        }
                    ],
                    "examples": [
                        {
                            "title": "Example title",
                            "code": "Example code",
                            "explanation": "Example explanation"
                        }
                    ]
                },
                "formattedDocumentation": "The full documentation formatted according to the specified style"
            }
            
            IMPORTANT: Return valid JSON only. No markdown code blocks. No extra text. No prefix or suffix. Just the raw JSON object.

            Here is the code:
            \`\`\`${language || ''}
            ${code}
            \`\`\`
        `;

        // Generate content
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        // Clean up response text to ensure it's valid JSON
        let cleanedText = text;
        
        // Remove any markdown code blocks (```json, ```, etc)
        cleanedText = cleanedText.replace(/```json\s*|```\s*|```javascript\s*/g, '');
        
        // Remove any trailing backticks that might be at the end
        cleanedText = cleanedText.replace(/\s*```\s*$/g, '');
        
        // Trim whitespace from beginning and end
        cleanedText = cleanedText.trim();
        
        // Parse the JSON
        let data;
        try {
            data = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse response as JSON:", e);
            console.error("Response text:", cleanedText.substring(0, 200) + "..."); // Log part of the response for debugging
            
            // Create a fallback response if parsing fails
            data = {
                documentation: {
                    overview: "Documentation generation encountered an error",
                    sections: [{
                        title: "Error Processing Documentation",
                        content: "The AI couldn't generate properly formatted documentation. Please try again with a different code snippet or format."
                    }],
                    examples: []
                },
                formattedDocumentation: "Error generating documentation."
            };
            
            return res.status(200).json({ 
                success: true, 
                documentation: data,
                generationError: true
            });
        }

        res.status(200).json({ 
            success: true, 
            documentation: data
        });
    } catch (error) {
        console.error("Error generating documentation:", error);
        res.status(500).json({ error: error.message || 'Failed to generate documentation' });
    }
};