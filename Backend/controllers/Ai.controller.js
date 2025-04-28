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
        const { description, projectTitle, projectType, generateDependencies } = req.body;
        
        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Project description is required'
            });
        }
        
        // Determine project context based on project type
        let projectContext = '';
        switch (projectType) {
            case 'Development':
                projectContext = 'a software development project with programming, testing, and deployment phases';
                break;
            case 'Marketing':
                projectContext = 'a marketing campaign with research, content creation, and promotion phases';
                break;
            case 'Research':
                projectContext = 'a research project with data collection, analysis, and reporting phases';
                break;
            case 'Event':
                projectContext = 'an event planning project with preparation, execution, and follow-up phases';
                break;
            default:
                projectContext = 'a general project management workflow';
                break;
        }
        
        // Enhanced prompt for more detailed task generation with new features
        const prompt = `
        Generate a comprehensive task breakdown for ${projectContext}.
        
        Project Title: ${projectTitle || 'New Project'}
        Project Description: ${description}
        
        Return a JSON response with the following structure:
        {
          "tasks": [
            {
              "title": "Task title",
              "description": "Detailed description of the task",
              "priority": "High/Medium/Low/Urgent", 
              "estimatedHours": number,
              "tags": ["tag1", "tag2"],
              ${generateDependencies ? `
              "dependencies": [
                {
                  "taskTitle": "Title of the prerequisite task",
                  "type": "finish-to-start",
                  "delay": 0
                }
              ],` : ''}
              "subtasks": [
                {
                  "title": "Subtask title",
                  "description": "Detailed description of the subtask",
                  "priority": "High/Medium/Low/Urgent",
                  "estimatedHours": number,
                  "tags": ["tag1", "tag2"],
                  ${generateDependencies ? `"dependencies": [],` : ''}
                  "subtasks": []
                }
              ]
            }
          ]
        }
        
        Make sure to:
        1. Create a logical task breakdown with 4-8 main tasks
        2. Each main task should have 2-5 subtasks
        3. Some subtasks can have their own subtasks (maximum 3 levels deep)
        4. Tasks should cover the entire project lifecycle from planning to completion
        5. Include appropriate priorities (Urgent, High, Medium, Low)
        6. Include realistic time estimates for each task in hours
        7. Add relevant tags to each task based on its nature and purpose
        ${generateDependencies ? `
        8. Create meaningful task dependencies between related tasks
        9. Use mostly "finish-to-start" dependencies, but occasionally use other types
        10. Set realistic delay values (in days) when appropriate for dependencies
        ` : ''}
        
        For ${projectType || 'standard'} projects, focus on:
        ${projectType === 'Development' ? '- Technical tasks like coding, testing, deployment\n- Bug fixing and code reviews\n- Documentation and technical standards' : ''}
        ${projectType === 'Marketing' ? '- Market research and audience analysis\n- Content creation and campaign execution\n- Analytics and performance tracking' : ''}
        ${projectType === 'Research' ? '- Data collection methodology\n- Analysis techniques and verification\n- Publication and presentation of findings' : ''}
        ${projectType === 'Event' ? '- Venue selection and logistics\n- Participant management and communications\n- Day-of coordination and post-event analysis' : ''}
        ${projectType === 'Standard' ? '- Team meetings\n- Progress reporting\n- Administrative tasks' : ''}
        `;

        // Call the AI model with the enhanced prompt
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

        // Process the response to ensure all tasks have the required fields
        const processedTasks = processTasksForAdvancedFeatures(response.tasks || [], generateDependencies);
        
        res.status(200).json({
            success: true,
            message: 'Tasks generated successfully',
            tasks: processedTasks
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

// New function to generate task health insights based on project data
export const generateTaskHealthInsights = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { tasks } = req.body;
        
        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task data is required'
            });
        }
        
        // Prepare task data for the AI prompt
        const taskData = tasks.map(task => ({
            id: task._id.toString(),
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            estimatedHours: task.estimatedHours || 0,
            actualHours: task.actualHours || 0,
            timeEntries: task.timeEntries?.length || 0,
            dependencies: task.dependencies?.length || 0,
            health: task.health?.status || 'unknown',
        }));
        
        // Prompt for analyzing task health and providing recommendations
        const prompt = `
        You are a project management expert. Analyze the following project tasks and provide insights on task health and recommendations.
        
        Task Data:
        ${JSON.stringify(taskData, null, 2)}
        
        Provide your analysis as a JSON object with the following structure:
        {
            "overallProjectHealth": "on-track|at-risk|delayed|ahead",
            "healthSummary": "A brief summary of the project health status",
            "criticalTasks": [
                {
                    "taskId": "id of the task",
                    "reason": "Why this task is critical/at risk",
                    "recommendation": "What should be done to address this task"
                }
            ],
            "recommendations": [
                "General recommendation for the project",
                "Another recommendation"
            ],
            "timeManagementInsights": "Analysis of time tracking data",
            "dependencyInsights": "Analysis of task dependencies"
        }

        Focus on identifying:
        1. Tasks that are blocking others
        2. Tasks that are taking longer than estimated
        3. High priority tasks that are at risk
        4. Bottlenecks in the workflow
        5. Resources that might be overallocated
        6. Opportunities to improve efficiency
        
        Only return the JSON object, nothing else.
        `;

        // Call the AI model
        const rawResponse = await generateResult(prompt);
        
        // Parse and clean the response
        let insights;
        try {
            insights = JSON.parse(rawResponse);
        } catch (e) {
            // If parsing fails, try to extract JSON from the text
            const jsonMatch = rawResponse.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                try {
                    insights = JSON.parse(jsonMatch[0]);
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
        
        res.status(200).json({
            success: true,
            message: 'Health insights generated successfully',
            insights
        });
    } catch (error) {
        console.error('Health insights generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate health insights',
            error: error.message
        });
    }
};

// New function to generate recurring task recommendations
export const generateRecurringTaskRecommendations = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { projectType, existingTasks } = req.body;
        
        // Prepare context based on project type
        let projectTypeContext = projectType || 'Standard';
        
        // Prepare the prompt
        const prompt = `
        You are a project management expert. Based on the project type "${projectTypeContext}", 
        recommend recurring tasks that would benefit this type of project.
        
        ${existingTasks && existingTasks.length > 0 ? 
          `Consider these existing tasks in your recommendations:\n${JSON.stringify(existingTasks.map(t => t.title), null, 2)}` : 
          ''}
        
        Return a JSON object with the following structure:
        {
            "recurringTasks": [
                {
                    "title": "Task title",
                    "description": "Description of the task and why it should be recurring",
                    "frequency": "daily|weekly|monthly|yearly",
                    "daysOfWeek": [1, 3, 5],
                    "estimatedHours": 2,
                    "priority": "Medium",
                    "tags": ["tag1", "tag2"]
                }
            ],
            "recommendations": [
                "Using recurring tasks for meetings can improve consistency",
                "Other recommendations about recurring task usage"
            ]
        }
        
        For ${projectTypeContext} projects, focus on:
        ${projectTypeContext === 'Development' ? '- Regular code reviews and sprint meetings\n- Testing cycles and quality assurance\n- System health checks and backups' : ''}
        ${projectTypeContext === 'Marketing' ? '- Content calendar management\n- Analytics reporting\n- Social media posting schedules' : ''}
        ${projectTypeContext === 'Research' ? '- Regular data collection intervals\n- Team status updates\n- Literature review updates' : ''}
        ${projectTypeContext === 'Event' ? '- Planning committee meetings\n- Vendor check-ins\n- Timeline milestone verifications' : ''}
        ${projectTypeContext === 'Standard' ? '- Team meetings\n- Progress reporting\n- Administrative tasks' : ''}
        
        Only return the JSON object, nothing else.
        `;
        
        // Call the AI model
        const rawResponse = await generateResult(prompt);
        
        // Parse the response
        let recommendations;
        try {
            recommendations = JSON.parse(rawResponse);
        } catch (e) {
            // If parsing fails, try to extract JSON from the text
            const jsonMatch = rawResponse.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                try {
                    recommendations = JSON.parse(jsonMatch[0]);
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
        
        res.status(200).json({
            success: true,
            message: 'Recurring task recommendations generated successfully',
            recommendations
        });
    } catch (error) {
        console.error('Recurring task recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate recurring task recommendations',
            error: error.message
        });
    }
};

// Helper function to process tasks and ensure they have all required fields for advanced features
function processTasksForAdvancedFeatures(tasks, includeDependencies = false) {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks.map(task => {
        // Ensure all tasks have required fields
        const processedTask = {
            title: task.title || 'Untitled Task',
            description: task.description || '',
            priority: task.priority || 'Medium',
            estimatedHours: task.estimatedHours || 0,
            tags: task.tags || []
        };
        
        // Add dependencies if requested
        if (includeDependencies) {
            processedTask.dependencies = task.dependencies || [];
        }
        
        // Process subtasks recursively
        if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
            processedTask.subtasks = processTasksForAdvancedFeatures(task.subtasks, includeDependencies);
        } else {
            processedTask.subtasks = [];
        }
        
        return processedTask;
    });
}

// Generate multiple snippets at once
export const generateBulkSnippets = async (req, res) => {
    try {
        const { prompt, count = 3, language } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Validate count
        const snippetCount = Math.min(Math.max(parseInt(count) || 3, 1), 5);
        
        // Prepare the prompt for multiple snippets
        const bulkPrompt = `
            Generate ${snippetCount} different code snippets based on the following prompt:
            "${prompt}"
            
            ${language ? `Use ${language} as the programming language for all snippets.` : ''}
            
            Return a JSON array with ${snippetCount} snippets, each with the following structure:
            [
              {
                "title": "Clear and concise title",
                "content": "// Your code here\\n// Use proper formatting\\n// Include comments\\n",
                "programmingLanguage": "${language || 'appropriate language'}",
                "description": "Detailed explanation of the code's purpose and usage",
                "tags": ["relevant", "tags"],
                "visibility": "private"
              },
              // ... more snippets
            ]
            
            Make each snippet unique and focused on a different aspect or implementation of the prompt.
            Ensure all snippets are well-commented and follow best practices.
            Only return the valid JSON array, nothing else.
        `;

        // Use the same model configuration from Ai.js but bypass the output formatting
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.9,
                topK: 1,
                topP: 1,
                responseMimeType: "application/json",
            }
        });

        // Generate content
        const result = await model.generateContent(bulkPrompt);
        const responseText = result.response.text();
        
        // Parse the response
        let snippets;
        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/(\[[\s\S]*\])/);
            if (jsonMatch) {
                snippets = JSON.parse(jsonMatch[0]);
            } else {
                snippets = JSON.parse(responseText);
            }
            
            // Validate result format
            if (!Array.isArray(snippets)) {
                throw new Error('Response is not an array');
            }
        } catch (err) {
            console.error('Failed to parse bulk snippets response:', err);
            console.error('Raw response:', responseText.substring(0, 500) + '...');
            return res.status(500).json({ 
                error: 'Failed to parse AI response',
                message: err.message
            });
        }

        // Return the parsed snippets
        res.status(200).json({
            success: true,
            snippets
        });
    } catch (error) {
        console.error('Error generating bulk snippets:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate bulk snippets'
        });
    }
};