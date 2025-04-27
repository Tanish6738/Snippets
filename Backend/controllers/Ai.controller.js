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

// Generate documentation for multiple code snippets
export const generateBulkDocumentation = async (req, res) => {
    try {
        const { snippets, style, level } = req.body;

        // Validate input
        if (!snippets || !Array.isArray(snippets) || snippets.length === 0) {
            return res.status(400).json({ error: 'At least one snippet is required' });
        }

        // Configure the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Determine documentation style
        const docStyle = style || 'standard'; // Options: standard, jsdoc, javadoc, docstring, etc.
        const detailLevel = level || 'medium'; // Options: basic, medium, comprehensive

        // Process snippets in batches to avoid hitting context limits
        const batchSize = 3; // Process 3 snippets at a time
        const results = [];
        let failureCount = 0;

        // Process snippets in batches
        for (let i = 0; i < snippets.length; i += batchSize) {
            const batchSnippets = snippets.slice(i, i + batchSize);
            const batchPromises = batchSnippets.map(async (snippet) => {
                try {
                    // Prepare the prompt for each snippet
                    const prompt = `
                        You are a documentation expert. Generate professional documentation for the following code snippet titled "${snippet.title}" written in ${snippet.programmingLanguage || 'the appropriate programming language'}.
                        
                        Use the ${docStyle} documentation style with ${detailLevel} detail level.
                        
                        Format your response as a JSON object with the following structure:
                        {
                            "title": "${snippet.title}",
                            "language": "${snippet.programmingLanguage}",
                            "documentation": {
                                "overview": "Brief overview of the code",
                                "sections": [
                                    {
                                        "title": "Section title (e.g., function name, class name, etc.)",
                                        "content": "Documentation content for this section",
                                        "params": [{"name": "paramName", "description": "param description", "type": "param type"}],
                                        "returns": {"description": "return description", "type": "return type"}
                                    }
                                ]
                            },
                            "formattedDocumentation": "The full documentation formatted according to the specified style"
                        }
                        
                        IMPORTANT: Return valid JSON only. No markdown code blocks. No extra text. No prefix or suffix. Just the raw JSON object.

                        Here is the code:
                        \`\`\`${snippet.programmingLanguage || ''}
                        ${snippet.content}
                        \`\`\`
                    `;

                    // Generate content
                    const result = await model.generateContent(prompt);
                    const response = result.response;
                    const text = response.text();
                    
                    // Clean up response text to ensure it's valid JSON
                    let cleanedText = text;
                    cleanedText = cleanedText.replace(/```json\s*|```\s*|```javascript\s*/g, '');
                    cleanedText = cleanedText.replace(/\s*```\s*$/g, '');
                    cleanedText = cleanedText.trim();
                    
                    // Parse the JSON
                    let data;
                    try {
                        data = JSON.parse(cleanedText);
                        
                        // Ensure all required properties exist
                        data.documentation = data.documentation || {};
                        data.documentation.overview = data.documentation.overview || `Documentation for ${snippet.title}`;
                        data.formattedDocumentation = data.formattedDocumentation || `# ${snippet.title}\n\n${data.documentation.overview}`;
                        
                        return {
                            snippetId: snippet._id,
                            title: snippet.title,
                            documentation: data
                        };
                    } catch (e) {
                        console.error(`Failed to parse JSON response for ${snippet.title}:`, e);
                        console.error("Response text:", cleanedText.substring(0, 200) + "..."); 
                        
                        throw new Error("Failed to parse documentation response");
                    }
                } catch (error) {
                    console.error(`Error generating documentation for snippet ${snippet.title}:`, error);
                    failureCount++;
                    
                    // Create a consistent error response with all required fields
                    return {
                        snippetId: snippet._id,
                        title: snippet.title,
                        error: 'Failed to generate documentation for this snippet',
                        documentation: {
                            overview: `The AI couldn't generate documentation for "${snippet.title}"`,
                            formattedDocumentation: `# ${snippet.title} - Documentation Generation Failed\n\nUnable to process this ${snippet.programmingLanguage} snippet.\n\nThis may be due to the complexity of the code or limitations of the AI model.`,
                            documentation: {
                                overview: `The AI couldn't generate documentation for "${snippet.title}"`
                            }
                        }
                    };
                }
            });

            // Wait for all snippets in the current batch to be processed
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        // Generate combined documentation if requested
        const combinedDocumentation = generateCombinedDocumentation(results, docStyle, snippets);

        res.status(200).json({ 
            success: true, 
            results,
            failureCount,
            totalProcessed: snippets.length,
            combinedDocumentation
        });
    } catch (error) {
        console.error("Error generating bulk documentation:", error);
        res.status(500).json({ error: error.message || 'Failed to generate bulk documentation' });
    }
};

// Helper function to generate combined documentation for multiple snippets
function generateCombinedDocumentation(results, style, originalSnippets) {
    // Create a title for the combined documentation
    const title = originalSnippets.length > 1 
        ? `Combined Documentation for ${originalSnippets.length} Snippets`
        : `Documentation for ${originalSnippets[0]?.title || 'Snippet'}`;
    
    // Generate markdown or chosen documentation style
    let combinedContent = `# ${title}\n\n`;
    
    // Table of contents
    combinedContent += `## Table of Contents\n\n`;
    results.forEach((result, index) => {
        if (result.documentation) {
            combinedContent += `${index + 1}. [${result.title}](#snippet-${index + 1})\n`;
        }
    });
    
    combinedContent += `\n---\n\n`;
    
    // Add each snippet's documentation
    results.forEach((result, index) => {
        if (!result.documentation) return;
        
        combinedContent += `<a id="snippet-${index + 1}"></a>\n`;
        combinedContent += `## ${index + 1}. ${result.title}\n\n`;
        
        // Add programming language if available
        const snippet = originalSnippets.find(s => s._id === result.snippetId);
        if (snippet && snippet.programmingLanguage) {
            combinedContent += `**Language:** ${snippet.programmingLanguage}\n\n`;
        }
        
        // Add overview
        if (result.documentation.overview) {
            combinedContent += `### Overview\n\n${result.documentation.overview}\n\n`;
        }
        
        // Use the formatted documentation if available
        if (result.documentation.formattedDocumentation) {
            combinedContent += `### Documentation\n\n${result.documentation.formattedDocumentation}\n\n`;
        }
        
        combinedContent += `---\n\n`;
    });
    
    // Add generation metadata
    const date = new Date().toLocaleDateString();
    combinedContent += `\n\n*Documentation generated on ${date}*\n`;
    
    return {
        title,
        content: combinedContent,
        format: 'markdown'
    };
}

// Generate tasks for a project based on a description
export const generateProjectTasks = async (req, res) => {
    try {
        const { description, projectTitle } = req.body;
        
        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Project description is required'
            });
        }
        
        const prompt = `
        Generate a comprehensive task breakdown for a project management system.
        
        Project Title: ${projectTitle || 'New Project'}
        Project Description: ${description}
        
        Return a JSON response with the following structure:
        {
          "tasks": [
            {
              "title": "Task title",
              "description": "Detailed description of the task",
              "priority": "High/Medium/Low",
              "estimatedHours": number,
              "subtasks": [
                {
                  "title": "Subtask title",
                  "description": "Detailed description of the subtask",
                  "priority": "High/Medium/Low",
                  "estimatedHours": number,
                  "subtasks": [
                    // Can have additional nested subtasks
                  ]
                }
              ]
            }
          ]
        }
        
        Make sure to:
        1. Create a logical task breakdown with 3-7 main tasks
        2. Each main task should have 2-5 subtasks
        3. Some subtasks can have their own subtasks (maximum 3 levels deep)
        4. Tasks should cover the entire project lifecycle
        5. Include appropriate priorities (High, Medium, Low)
        6. Include realistic time estimates for each task in hours
        `;

        // Call the AI model
        const rawResponse = await generateResult(prompt);
        
        // Parse and clean the response
        let response;
        try {
            // Try to parse as JSON directly
            response = JSON.parse(rawResponse);
        } catch (e) {
            // If that fails, try to extract JSON from the text
            const jsonMatch = rawResponse.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                try {
                    response = JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to parse AI response',
                        error: e2.message
                    });
                }
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Invalid response format from AI',
                    error: e.message
                });
            }
        }
        
        // If tasks are in fileTree format (due to existing AI system instruction), 
        // transform to expected format
        if (response.fileTree && !response.tasks) {
            try {
                // Try to convert from fileTree format to tasks format
                response = {
                    tasks: JSON.parse(response.fileTree.snippet.file.content)
                };
            } catch (e) {
                // If conversion fails, return error
                return res.status(500).json({
                    success: false,
                    message: 'Failed to convert AI response to task format',
                    error: e.message,
                    rawResponse
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Tasks generated successfully',
            tasks: response.tasks || []
        });
    } catch (error) {
        console.error('Task generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate tasks',
            error: error.message
        });
    }
};