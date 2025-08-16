
import { GoogleGenAI, Type } from "@google/genai";
import { PromptType, StoryIdea } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'A creative, compelling headline or title for the story idea.',
      },
      summary: {
        type: Type.STRING,
        description: 'A brief, one-paragraph summary of the potential article or story, outlining the main angle or narrative.',
      },
    },
    required: ['title', 'summary'],
  },
};

function getSystemInstruction(): string {
  return `You are a creative story idea generator for journalists and writers. Your goal is to provide 3 to 5 distinct and compelling story ideas based on the user's prompts. Respond ONLY with a valid JSON array of objects that matches the provided schema. Each object must contain a 'title' and a 'summary'.`;
}

function buildPrompt(promptType: PromptType, prompts: any[]): { text: string; images?: { mimeType: string, data: string }[] } {
  switch (promptType) {
    case PromptType.TEXT:
      return { text: `Generate story ideas based on the following topics: ${prompts.join(', ')}.` };
    case PromptType.EMOJI:
      return { text: `Generate story ideas inspired by this sequence of emojis: ${prompts[0]}.` };
    case PromptType.IMAGE:
      return {
        text: 'Generate story ideas inspired by the following image(s). Analyze the content, mood, and potential narratives within the image(s).',
        images: prompts.map(p => ({ mimeType: p.mimeType, data: p.base64 }))
      };
    default:
      throw new Error('Invalid prompt type');
  }
}

export const generateStoryIdeas = async (
  promptType: PromptType,
  prompts: any[]
): Promise<StoryIdea[]> => {
  const { text, images } = buildPrompt(promptType, prompts);

  const modelParams: any = {
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(),
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.8,
      topP: 0.95,
    },
  };

  if (images && images.length > 0) {
    const contentParts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [{ text }];
    images.forEach(image => {
        contentParts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            }
        });
    });
    modelParams.contents = { parts: contentParts };
  } else {
    modelParams.contents = text;
  }

  try {
    const response = await ai.models.generateContent(modelParams);

    const jsonText = response.text.trim();
    const parsedIdeas = JSON.parse(jsonText) as StoryIdea[];
    
    if (!Array.isArray(parsedIdeas) || parsedIdeas.some(idea => !idea.title || !idea.summary)) {
        throw new Error("AI returned an invalid data structure.");
    }
    
    return parsedIdeas;

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate story ideas from the AI. Please check your prompts or try again later.');
  }
};


export const generateResearchPlan = async (idea: StoryIdea): Promise<string> => {
  const prompt = `
    For the following story idea:
    Title: "${idea.title}"
    Summary: "${idea.summary}"

    Generate a comprehensive research work plan for a journalist. The plan should be well-structured, between 150 and 250 words, and include the following sections, formatted in Markdown:
    
    ### Story Outline
    A potential narrative structure or list of key points to cover.
    
    ### Potential Sources
    - **Primary Sources:** Suggest types of people to interview (e.g., experts, officials, affected individuals).
    - **Secondary Sources:** Suggest types of documents, reports, or data to look for.
    
    ### Key Questions to Answer
    List critical questions the journalist should seek to answer in their reporting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 256 },
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error('Gemini API Error (Research Plan):', error);
    throw new Error('Failed to generate research plan. Please try again.');
  }
};
