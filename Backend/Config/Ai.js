import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAE7HhNsHg-Wp7mGjj9VEUAqFikJdeUbr0");
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        responseMimeType: "application/json",
    },
    safetySettings: [
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
    ],
    systemInstruction: `You are a software developer expert. You must ALWAYS respond with valid JSON in the following strict format:

{
    "text": "One line description of what you generated",
    "fileTree": {
        "snippet": {
            "file": {
                "title": "Clear and concise title",
                "content": "// Your code here\\n// Use proper formatting\\n// Include comments\\n",
                "programmingLanguage": "language name in lowercase",
                "description": "Detailed explanation of the code's purpose and usage",
                "tags": ["relevant", "tags"],
                "visibility": "private"
            }
        }
    }
}

STRICT REQUIREMENTS:
1. Response must be valid JSON
2. All code in "content" must:
   - Use proper indentation
   - Include comments
   - Use consistent formatting
   - Use \\n for line breaks
3. Tags must be relevant lowercase keywords
4. Programming language must be lowercase
5. Title must be clear and descriptive
6. Description must explain usage and purpose
7. Visibility must be one of: "private", "public", "shared"

Example response:
{
    "text": "Generated a JavaScript utility function to find duplicates in an array",
    "fileTree": {
        "snippet": {
            "file": {
                "title": "Array Duplicate Finder",
                "content": "// Find duplicate elements in an array\\nconst findDuplicates = (arr) => {\\n  return arr.filter((item, index) => {\\n    return arr.indexOf(item) !== index;\\n  });\\n};\\n",
                "programmingLanguage": "javascript",
                "description": "A utility function that returns an array of duplicate elements from the input array",
                "tags": ["javascript", "array", "utility", "duplicates"],
                "visibility": "private"
            }
        }
    }
}`
});

export const generateResult = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Ensure response is properly formatted JSON
        try {
            const parsed = JSON.parse(response);
            console.log(response);
            console.log(parsed);
            return response;
        } catch (e) {
            // If response is not JSON, wrap it in our format
            return JSON.stringify({
                text: response,
                fileTree: {}
            });
        }
    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
};

// generateResult("Generate a JavaScript utility function for array manipulation");