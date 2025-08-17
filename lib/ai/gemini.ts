
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DEFAULT_RULES = [
  "No console.log statements.",
  "Functions should not exceed 50 lines of code.",
  "Avoid nested loops more than 2 levels deep.",
  "Use meaningful variable names.",
  "Ensure all functions have JSDoc comments.",
];

export async function analyzeCode(code: string, customRules: string[] = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const rules = [...DEFAULT_RULES, ...customRules].join('\n- ');

  const prompt = `
    As a world-class software engineer, please review the following code snippet.
    Analyze it based on the following rules:
    - ${rules}

    The code to review is:
    \`\`\`
    ${code}
    \`\`\`

    Provide your feedback in a structured JSON format. The JSON object should have a single key "issues" which is an array of objects. Each object in the array should represent a single issue and have the following keys: "line" (the line number of the issue), "severity" (one of "Critical", "High", "Medium", "Low"), "description" (a detailed explanation of the issue and how to fix it). If there are no issues, return an empty array.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response to ensure it's valid JSON
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error analyzing code with Gemini:", error);
    // Return a structured error
    return { error: "Failed to analyze code.", details: error };
  }
}