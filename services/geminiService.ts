import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResponse, ScriptAnalysis, TopicSuggestion } from '../types';

// Initialize the client
// CRITICAL: The API key must be available in process.env.API_KEY
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Analyzes the provided script text and suggests new topics.
 * Returns a structured JSON object containing both analysis and suggestions.
 */
export const analyzeAndSuggest = async (scriptText: string): Promise<AnalysisResponse> => {
  if (!apiKey) throw new Error("API Key is missing");

  const model = "gemini-2.5-flash";

  const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      analysis: {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING, description: "The overall tone of the script (e.g., energetic, serious, educational)." },
          targetAudience: { type: Type.STRING, description: "The likely demographic or interest group for this video." },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 key topics or keywords found in the script." },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What the script does well." },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Areas for improvement." },
          summary: { type: Type.STRING, description: "A brief 2-sentence summary of the content." }
        },
        required: ["tone", "targetAudience", "keywords", "strengths", "weaknesses", "summary"]
      },
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy YouTube video title." },
            reason: { type: Type.STRING, description: "Why this topic would be successful based on the analysis." },
            expectedVibe: { type: Type.STRING, description: "The suggested tone for this new video." }
          },
          required: ["title", "reason", "expectedVibe"]
        }
      }
    },
    required: ["analysis", "suggestions"]
  };

  const prompt = `
    You are an expert YouTube content strategist. 
    Please analyze the following script text (which may be in Korean or English) and provide strategic insights.
    Also, based on the style and content of this script, suggest 5 creative and viral-worthy new video topics that would appeal to the same audience.
    
    Output MUST be in Korean.
    
    Script to analyze:
    "${scriptText.substring(0, 10000)}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a professional Korean YouTube consultant. Analyze accurately and provide engaging title suggestions."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResponse;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Generates a full script for a selected topic using streaming.
 */
export const generateScriptStream = async (
  topic: TopicSuggestion, 
  baseStyle: ScriptAnalysis,
  onChunk: (text: string) => void
): Promise<void> => {
  if (!apiKey) throw new Error("API Key is missing");

  const model = "gemini-2.5-flash"; // Flash is fast and good for drafting

  const prompt = `
    Write a full, engaging YouTube script for a video titled: "${topic.title}".
    
    Context:
    - Target Audience: ${baseStyle.targetAudience}
    - Desired Tone: ${topic.expectedVibe} (similar to the previous style: ${baseStyle.tone})
    - Key Goal: Make it viral and highly engaging.
    
    Structure:
    1. Hook (0-30s): Grab attention immediately.
    2. Intro: Brief introduction of the topic.
    3. Main Content: 3 key points or sections.
    4. Call to Action (CTA): Like, Subscribe, Comment.
    5. Outro.

    Language: Korean.
    Format: Use Markdown for headers, bold text for emphasis, and clear paragraph breaks.
  `;

  try {
    const result = await ai.models.generateContentStream({
      model: model,
      contents: prompt
    });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Script generation failed:", error);
    throw error;
  }
};
