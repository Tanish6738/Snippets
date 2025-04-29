import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { generateResult } from '../Config/Ai.js';
import Project from '../Models/project.model.js';
import Task from '../Models/task.model.js';

// Load environment variables
dotenv.config();

// Initialize the Google Generative AI API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAE7HhNsHg-Wp7mGjj9VEUAqFikJdeUbr0");

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
        const { description, projectTitle, projectType, generateDependencies, recommendAssignees, projectId } = req.body; // Added recommendAssignees, projectId

        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Project description is required'
            });
        }

        let projectContext = '';
        let membersInfo = '';
        if (projectId) {
            const project = await Project.findById(projectId)
                .select('title description projectType members')
                .populate('members.user', 'username _id role');
            if (project) {
                projectContext = `a ${project.projectType || 'Standard'} project titled "${project.title}"`;
                if (project.members && project.members.length > 0) {
                    membersInfo = ` Project members are: ${JSON.stringify(project.members.map(m => ({ id: m.user._id, username: m.user.username, role: m.role })), null, 2)}.`;
                }
            }
        } else {
             projectContext = `a ${projectType || 'general'} project management workflow`;
        }


        // Enhanced prompt for more detailed task generation with new features
        const prompt = `
        Generate a comprehensive task breakdown for ${projectContext}.
        ${membersInfo}

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
              "category": "Development/Testing/etc.", // Add category suggestion
              ${generateDependencies ? `"dependencies": [ { "taskTitle": "Title of prerequisite task", "type": "finish-to-start", "delay": 0 } ],` : ''}
              ${recommendAssignees ? `"recommendedAssigneeIds": ["user_id_1", "user_id_2"], // Suggest based on membersInfo if provided` : ''}
              "subtasks": [
                {
                  "title": "Subtask title",
                  "description": "Detailed description of the subtask",
                  "priority": "High/Medium/Low/Urgent",
                  "estimatedHours": number,
                  "tags": ["tag1", "tag2"],
                  "category": "Development/Testing/etc.",
                  ${generateDependencies ? `"dependencies": [],` : ''}
                  ${recommendAssignees ? `"recommendedAssigneeIds": ["user_id_1"],` : ''}
                  "subtasks": [] // Max 3 levels deep
                }
              ]
            }
          ]
        }

        Make sure to:
        1. Create a logical task breakdown (4-8 main tasks).
        2. Each main task can have 2-5 subtasks.
        3. Tasks cover the project lifecycle.
        4. Include priorities, time estimates, relevant tags, and a category.
        ${generateDependencies ? `5. Create meaningful task dependencies (mostly 'finish-to-start').` : ''}
        ${recommendAssignees && membersInfo ? `6. Recommend assignees (provide user IDs) for tasks based on member roles and potential task relevance.` : ''}

        For ${projectType || 'standard'} projects, focus on relevant task types.
        Return only the valid JSON object.
        `;

        // Generate content
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

        // Process the response to ensure all tasks have the required fields
        // Pass recommendAssignees flag to the processing function
        const processedTasks = processTasksForAdvancedFeatures(response.tasks || [], generateDependencies, recommendAssignees);

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


// Generate suggestions for a new task based on description
export const suggestTaskDetails = async (req, res) => {
    try {
        const { description, projectId } = req.body;

        if (!description) {
            return res.status(400).json({ success: false, message: 'Task description is required' });
        }

        let projectContext = 'a general project';
        if (projectId) {
            const project = await Project.findById(projectId).select('title description projectType');
            if (project) {
                projectContext = `the project "${project.title}" (${project.projectType || 'Standard'} type): ${project.description || ''}`;
            }
        }

        const prompt = `
        Based on the following task description for ${projectContext}, suggest details for the task.

        Task Description: "${description}"

        Return a JSON object with suggestions for:
        - title: A concise and informative task title (max 15 words).
        - suggestedDescription: A slightly refined or expanded description if needed, otherwise keep the original.
        - priority: Suggest 'Low', 'Medium', 'High', or 'Urgent'.
        - tags: Suggest 2-4 relevant tags (e.g., "planning", "bug", "frontend", "urgent", "research").
        - estimatedHours: A rough estimate in hours.
        - category: Suggest a category like 'Development', 'Testing', 'Documentation', 'Meeting', 'Design', etc.

        Example JSON structure:
        {
          "title": "Implement User Authentication",
          "suggestedDescription": "Set up user login and registration using JWT.",
          "priority": "High",
          "tags": ["backend", "security", "auth"],
          "estimatedHours": 8,
          "category": "Development"
        }

        Return only the valid JSON object.
        `;

        const rawResponse = await generateResult(prompt);
        const suggestions = JSON.parse(rawResponse); // Assuming generateResult handles JSON parsing or extraction

        res.status(200).json({ success: true, suggestions });

    } catch (error) {
        console.error("Error suggesting task details:", error);
        res.status(500).json({ success: false, message: 'Failed to suggest task details', error: error.message });
    }
};

// Check for potential duplicate tasks within a project
export const checkDuplicateTask = async (req, res) => {
    try {
        const { description, projectId } = req.body;

        if (!description || !projectId) {
            return res.status(400).json({ success: false, message: 'Task description and project ID are required' });
        }

        // Fetch existing tasks for the project
        const existingTasks = await Task.find({ project: projectId }).select('title description').limit(50); // Limit for performance

        if (existingTasks.length === 0) {
            return res.status(200).json({ success: true, isDuplicate: false, duplicates: [] });
        }

        const existingTaskDescriptions = existingTasks.map(task => ({ id: task._id, title: task.title, description: task.description }));

        const prompt = `
        Analyze the following new task description and compare it semantically to the list of existing tasks in the project.
        Determine if the new task is likely a duplicate of any existing tasks.

        New Task Description: "${description}"

        Existing Tasks:
        ${JSON.stringify(existingTaskDescriptions, null, 2)}

        Return a JSON object with the following structure:
        {
          "isDuplicate": boolean, // true if a likely duplicate is found
          "duplicates": [ // List of likely duplicates
            {
              "taskId": "existing_task_id",
              "title": "Existing Task Title",
              "similarityScore": number // A score from 0 to 1 indicating similarity
            }
          ],
          "reasoning": "Brief explanation if it's a duplicate or not"
        }

        Consider titles and descriptions for similarity. Aim for a high threshold for declaring a duplicate (e.g., similarityScore > 0.85).
        Return only the valid JSON object.
        `;

        const rawResponse = await generateResult(prompt);
        const result = JSON.parse(rawResponse); // Assuming generateResult handles JSON parsing or extraction

        res.status(200).json({ success: true, ...result });

    } catch (error) {
        console.error("Error checking for duplicate tasks:", error);
        res.status(500).json({ success: false, message: 'Failed to check for duplicate tasks', error: error.message });
    }
};

// Break down a complex task into subtasks
export const breakdownTask = async (req, res) => {
    try {
        const { description, parentTaskId, projectId } = req.body; // parentTaskId is optional

        if (!description) {
            return res.status(400).json({ success: false, message: 'Task description is required' });
        }

        let projectContext = '';
        if (projectId) {
             const project = await Project.findById(projectId).select('title projectType');
             if (project) projectContext = ` within the "${project.title}" (${project.projectType}) project`;
        }

        const prompt = `
        Break down the following complex task description into smaller, actionable subtasks${projectContext}.

        Main Task Description: "${description}"

        Generate a list of 2-6 subtasks. For each subtask, provide:
        - title: A concise title.
        - description: A brief description (optional).
        - priority: 'Low', 'Medium', 'High', or 'Urgent'.
        - estimatedHours: Rough estimate in hours.
        - tags: 1-2 relevant tags.

        Return a JSON object with the following structure:
        {
          "subtasks": [
            {
              "title": "Subtask Title 1",
              "description": "Details for subtask 1",
              "priority": "Medium",
              "estimatedHours": 3,
              "tags": ["tagA"]
            },
            {
              "title": "Subtask Title 2",
              // ... other fields
            }
          ]
        }

        Ensure subtasks are logical steps to complete the main task.
        Return only the valid JSON object.
        `;

        const rawResponse = await generateResult(prompt);
        const result = JSON.parse(rawResponse); // Assuming generateResult handles JSON parsing or extraction

        // Ensure the response structure is correct
        const subtasks = (result.subtasks || []).map(st => ({
             title: st.title || 'Untitled Subtask',
             description: st.description || '',
             priority: st.priority || 'Medium',
             estimatedHours: st.estimatedHours || 0,
             tags: st.tags || []
        }));


        res.status(200).json({ success: true, subtasks });

    } catch (error) {
        console.error("Error breaking down task:", error);
        res.status(500).json({ success: false, message: 'Failed to break down task', error: error.message });
    }
};

// Recommend assignees for a task
export const recommendAssignee = async (req, res) => {
    try {
        const { description, projectId, taskId } = req.body; // taskId is optional (for existing tasks)

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'Project ID is required' });
        }
        if (!description && !taskId) {
             return res.status(400).json({ success: false, message: 'Task description or ID is required' });
        }

        const project = await Project.findById(projectId)
            .populate('members.user', 'username email role') // Populate user details
            .populate({
                path: 'tasks',
                select: 'title description assignedTo tags createdBy', // Select relevant task fields
                populate: { path: 'assignedTo', select: 'username' } // Populate assignees within tasks
            });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const members = project.members.map(m => ({
            id: m.user._id,
            username: m.user.username,
            role: m.role
        }));

        // Simplified history - count tasks per user (could be more sophisticated)
        const taskHistory = project.tasks.reduce((acc, task) => {
            task.assignedTo.forEach(assignee => {
                const userId = assignee._id.toString();
                acc[userId] = (acc[userId] || 0) + 1;
            });
            return acc;
        }, {});

        const taskDesc = taskId ? (await Task.findById(taskId).select('title description tags'))?.description : description;
        if (!taskDesc) {
             return res.status(404).json({ success: false, message: 'Task description not found' });
        }


        const prompt = `
        Based on the task description, project members, their roles, and past task assignments, recommend suitable assignees for the task.

        Task Description: "${taskDesc}"
        Project Members: ${JSON.stringify(members, null, 2)}
        Task Assignment History (User ID: Task Count): ${JSON.stringify(taskHistory, null, 2)}

        Return a JSON object with a list of recommended assignees, ordered by suitability:
        {
          "recommendations": [
            {
              "userId": "user_id_1",
              "username": "username1",
              "reasoning": "Why this user is recommended (e.g., relevant role, past experience)",
              "confidenceScore": number // Score from 0 to 1
            },
            {
              "userId": "user_id_2",
              // ... other fields
            }
          ]
        }

        Consider member roles ('Admin', 'Contributor') and users who have handled similar tasks (based on description/tags if available, or just general activity). Limit to 3 recommendations.
        Return only the valid JSON object.
        `;

        const rawResponse = await generateResult(prompt);
        const result = JSON.parse(rawResponse); // Assuming generateResult handles JSON parsing or extraction

        res.status(200).json({ success: true, recommendations: result.recommendations || [] });

    } catch (error) {
        console.error("Error recommending assignee:", error);
        res.status(500).json({ success: false, message: 'Failed to recommend assignee', error: error.message });
    }
};

// Generate a natural language summary of project progress
export const generateProjectSummary = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId)
            .select('title description status progress createdAt deadline')
            .populate({
                path: 'tasks',
                select: 'status priority dueDate completedAt createdAt', // Select fields relevant for summary
            });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const taskStats = {
            total: project.tasks.length,
            toDo: project.tasks.filter(t => t.status === 'To Do').length,
            inProgress: project.tasks.filter(t => t.status === 'In Progress').length,
            completed: project.tasks.filter(t => t.status === 'Completed').length,
            onHold: project.tasks.filter(t => t.status === 'On Hold').length,
            cancelled: project.tasks.filter(t => t.status === 'Cancelled').length,
            overdue: project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length,
        };

        const prompt = `
        Generate a concise, natural language summary of the project's progress based on the following data.

        Project Title: "${project.title}"
        Project Status: ${project.status}
        Project Progress: ${project.progress}%
        Project Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
        Created At: ${new Date(project.createdAt).toLocaleDateString()}

        Task Statistics:
        - Total Tasks: ${taskStats.total}
        - To Do: ${taskStats.toDo}
        - In Progress: ${taskStats.inProgress}
        - Completed: ${taskStats.completed}
        - On Hold: ${taskStats.onHold}
        - Cancelled: ${taskStats.cancelled}
        - Overdue: ${taskStats.overdue}

        Return a JSON object with the following structure:
        {
          "summary": "A paragraph summarizing the project's current state, highlighting key numbers (like completed tasks, progress percentage, overdue tasks) and overall health (e.g., on track, needs attention)."
        }

        Keep the summary informative but brief (2-4 sentences).
        Return only the valid JSON object.
        `;

        const rawResponse = await generateResult(prompt);
        const result = JSON.parse(rawResponse); // Assuming generateResult handles JSON parsing or extraction

        res.status(200).json({ success: true, summary: result.summary || 'Could not generate summary.' });

    } catch (error) {
        console.error("Error generating project summary:", error);
        res.status(500).json({ success: false, message: 'Failed to generate project summary', error: error.message });
    }
};


// Helper function to process tasks and ensure they have all required fields for advanced features
// Updated to include recommendAssignees
function processTasksForAdvancedFeatures(tasks, includeDependencies = false, includeAssignees = false) {
    if (!tasks || !Array.isArray(tasks)) return [];

    return tasks.map(task => {
        // Ensure all tasks have required fields
        const processedTask = {
            title: task.title || 'Untitled Task',
            description: task.description || '',
            priority: task.priority || 'Medium',
            estimatedHours: task.estimatedHours || 0,
            tags: task.tags || [],
            category: task.category || 'General' // Add category
        };

        // Add dependencies if requested
        if (includeDependencies) {
            processedTask.dependencies = task.dependencies || [];
        }

        // Add recommended assignees if requested
        if (includeAssignees) {
            processedTask.recommendedAssigneeIds = task.recommendedAssigneeIds || [];
        }


        // Process subtasks recursively
        if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
            processedTask.subtasks = processTasksForAdvancedFeatures(task.subtasks, includeDependencies, includeAssignees); // Pass flags down
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

// Generate recurring task recommendations for a project
export const generateRecurringTaskRecommendations = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { projectType, existingTasks = [] } = req.body;
        const userId = req.user._id;

        if (!projectId || !projectType) {
            return res.status(400).json({
                success: false,
                message: 'Project ID and projectType are required.'
            });
        }

        // Fetch project for context (optional, for more advanced logic)
        const project = await Project.findById(projectId).select('title description projectType deadline');
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found.'
            });
        }

        // Prepare prompt for AI
        const prompt = `
        You are an expert project manager AI. Based on the following project type and existing tasks, recommend a list of recurring tasks that are common and valuable for this type of project.
        
        Project Type: ${projectType}
        Project Title: ${project.title}
        Project Description: ${project.description}
        Project Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
        Existing Tasks: ${JSON.stringify(existingTasks, null, 2)}

        For each recommended recurring task, provide:
        - title
        - description
        - recommended frequency (daily, weekly, monthly, etc.)
        - suggested day(s) (if applicable)
        - estimated hours
        - priority
        - tags
        - why this recurring task is important for this project type

        Return a JSON array of objects with this structure:
        [
          {
            "title": "...",
            "description": "...",
            "frequency": "weekly",
            "daysOfWeek": [1],
            "estimatedHours": 1,
            "priority": "Medium",
            "tags": ["meeting", "recurring"],
            "reasoning": "..."
          }
        ]
        Only return the valid JSON array, nothing else.
        `;

        // Call AI to get recommendations
        const aiResponse = await generateResult(prompt);
        let recommendations = [];
        try {
            recommendations = JSON.parse(aiResponse);
        } catch (e) {
            // Try to extract JSON array from text
            const match = aiResponse.match(/\[.*\]/s);
            if (match) {
                recommendations = JSON.parse(match[0]);
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to parse AI response',
                    error: e.message
                });
            }
        }

        res.status(200).json({
            success: true,
            recommendations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate recurring task recommendations',
            error: error.message
        });
    }
};

// Generate AI-powered health insights for project tasks
export const generateTaskHealthInsights = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { tasks } = req.body; // Optionally allow passing tasks, or fetch from DB
        const userId = req.user._id;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'Project ID is required.' });
        }

        // Fetch project and tasks if not provided
        let project = await Project.findById(projectId).select('title description deadline projectType');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        let projectTasks = tasks;
        if (!projectTasks) {
            projectTasks = await Task.find({ project: projectId })
                .select('title description status priority dueDate estimatedHours assignedTo tags dependencies');
        }

        // Prepare prompt for AI
        const prompt = `
        You are an expert project manager AI. Analyze the following project and its tasks, and provide health insights:
        - Identify at-risk, delayed, or blocked tasks
        - Suggest improvements or focus areas
        - Summarize overall project health
        - Highlight tasks with missing deadlines, unclear priorities, or no assignees
        
        Project: ${project.title} (${project.projectType})\n${project.description}\nDeadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
        Tasks: ${JSON.stringify(projectTasks, null, 2)}

        Return a JSON object with:
        {
          "summary": "Overall project health summary.",
          "atRiskTasks": [ { "title": "...", "reason": "..." } ],
          "delayedTasks": [ { "title": "...", "dueDate": "..." } ],
          "blockedTasks": [ { "title": "...", "blockedBy": ["Task A"] } ],
          "recommendations": [ "..." ]
        }
        Only return the valid JSON object, nothing else.
        `;

        const aiResponse = await generateResult(prompt);
        let insights = {};
        try {
            insights = JSON.parse(aiResponse);
        } catch (e) {
            // Try to extract JSON object from text
            const match = aiResponse.match(/\{[\s\S]*\}/);
            if (match) {
                insights = JSON.parse(match[0]);
            } else {
                return res.status(500).json({ success: false, message: 'Failed to parse AI response', error: e.message });
            }
        }

        res.status(200).json({ success: true, insights });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate task health insights', error: error.message });
    }
};