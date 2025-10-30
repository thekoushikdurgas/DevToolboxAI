

import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const minifyCode = async (code: string, language: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }
  
  const prompt = `
    You are an expert code minifier.
    Minify the following ${language} code.
    Remove all unnecessary characters, whitespace, and comments without altering its functionality.
    IMPORTANT: Respond with ONLY the minified code itself. Do not include any explanatory text, markdown formatting (like \`\`\`js), or any other characters before or after the code.

    Code to minify:
    ---
    ${code}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    return (response.text || '').trim();

  } catch (error) {
    console.error('Error minifying code with Gemini API:', error);
    throw new Error('Failed to minify code. Please check the console for details.');
  }
};


export const generateCheatsheet = async (topic: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }

  const prompt = `
    You are an expert developer assistant. Create a concise and helpful cheatsheet for the following topic: "${topic}".
    Use markdown formatting, including code blocks for examples. 
    Focus on the most important concepts, syntax, and common use cases.
    For "how to start" queries, provide a clear, step-by-step guide.
    IMPORTANT: Respond with ONLY the cheatsheet content in markdown format. Do not include any introductory or concluding remarks like "Here is the cheatsheet...".
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return (response.text || '').trim();
  } catch (error) {
    console.error('Error generating cheatsheet with Gemini API:', error);
    throw new Error('Failed to generate cheatsheet. Please check the console for details.');
  }
};

export const generateAndExplainRegex = async (description: string): Promise<{ regex: string; explanation: string; }> => {
  if (!API_KEY) throw new Error("API key is not configured.");

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the following description, generate a JavaScript-compatible regular expression and a clear, step-by-step explanation of how it works. Description: "${description}"`,
      config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  regex: {
                      type: Type.STRING,
                      description: "The generated regular expression pattern, without slashes.",
                  },
                  explanation: {
                      type: Type.STRING,
                      description: "A detailed but easy-to-understand explanation of the regex pattern.",
                  }
              }
          },
      }
  });

  try {
      const jsonStr = (response.text || '').trim();
      return JSON.parse(jsonStr);
  } catch (error) {
      console.error('Error parsing regex generation response:', error, "Raw response:", response.text);
      throw new Error('Failed to generate or parse the regular expression. The model may have returned an invalid format.');
  }
};

export const explainRegex = async (regex: string): Promise<string> => {
  if (!API_KEY) throw new Error("API key is not configured.");

  const prompt = `
    You are a regular expression expert. Explain the following regex pattern in a clear, step-by-step manner.
    Break down each part of the pattern and describe what it does.
    Use markdown for formatting.
    
    Regex to explain: \`${regex}\`
  `;

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
  });

  return (response.text || '').trim();
};

export const generateTypes = async (jsonString: string, typeSystem: 'TypeScript' | 'Zod Schema', rootTypeName: string): Promise<string> => {
  if (!API_KEY) throw new Error("API key is not configured.");
  
  const prompt = `
    You are a code generation expert. Analyze the provided JSON object and generate a corresponding type definition.
    
    - Target System: ${typeSystem}
    - Root Type Name: ${rootTypeName || 'RootType'}
    - JSON Input:
    \`\`\`json
    ${jsonString}
    \`\`\`
    
    Rules:
    - Infer types as accurately as possible (string, number, boolean, array, object).
    - Handle nested objects by creating separate type/schema definitions.
    - If generating a Zod schema, ensure you include \`import { z } from 'zod';\` at the top.
    - Respond with ONLY the generated code. Do not include any explanations or markdown formatting like \`\`\`typescript.
  `;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using pro for better code generation
      contents: prompt,
  });
  
  return (response.text || '').trim();
};

export const refactorCode = async (code: string, language: string, instructions: string): Promise<string> => {
  if (!API_KEY) throw new Error("API key is not configured.");
  
  const prompt = `
    You are an expert software engineer specializing in code quality and refactoring.
    Refactor the following ${language} code based on the provided instructions.
    
    Instructions: "${instructions || 'Improve readability, maintainability, and performance.'}"
    
    Code to refactor:
    \`\`\`${language.toLowerCase()}
    ${code}
    \`\`\`
    
    Rules:
    - The refactored code must maintain the original functionality.
    - Apply modern best practices for the specified language.
    - Add comments only where necessary to clarify complex logic.
    - Respond with ONLY the refactored code. Do not include any explanations or markdown formatting.
  `;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using pro for better code generation
      contents: prompt,
  });
  
  return (response.text || '').trim();
};

export const generateCodeFromHtml = async (html: string): Promise<string> => {
    if (!API_KEY) throw new Error("API key is not configured.");

    const prompt = `
      You are an expert web developer. Based on the following HTML content, generate a single, self-contained HTML file.
      This file should include the necessary HTML structure, embedded CSS within a <style> tag, and JavaScript within a <script> tag 
      to visually and functionally replicate the original page as closely as possible.
      
      Focus on recreating the layout, styling, and basic interactivity. You may omit external scripts or complex application logic that cannot be replicated.
      
      IMPORTANT: Respond with ONLY the generated code inside a single HTML block. Do not include any introductory text or markdown formatting like \`\`\`html.
      
      Original HTML:
      ---
      ${html}
      ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });

    return (response.text || '').trim();
};
