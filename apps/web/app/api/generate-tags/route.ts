import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { GenerateTagsRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, GenerateTagsRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { memoryContents } = validation.data;

    // If no memory contents or empty array, return empty tags
    if (memoryContents.length === 0) {
      return NextResponse.json({ tags: [] });
    }

    // Filter out null/undefined/empty strings
    const validContents = memoryContents
      .filter((content: string | null | undefined) => content && content.trim().length > 0)
      .slice(0, 20); // Limit to 20 most recent memories to avoid token limits

    if (validContents.length === 0) {
      return NextResponse.json({ tags: [] });
    }

    // Combine all memory contents into a single text
    const combinedContent = validContents.join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following memory entries and generate 2-3 short activity tags that best describe the shared experiences. 
Each tag should be 2-4 words, in English, and describe a specific activity or theme (e.g., "Late Night Study", "Coffee Runs", "Gym Buddy", "Jam Sessions").
Return only the tags, one per line, without numbers or bullets. Do not include any other text.

Memory entries:
${combinedContent}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed is priority here
      }
    });

    const responseText = response.text || '';
    
    // Parse the response to extract tags
    // Split by newlines and filter out empty lines
    const tags = responseText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3); // Limit to 3 tags max

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Gemini API Error for tag generation:", error);
    // Return empty tags on error
    return NextResponse.json({ tags: [] });
  }
}

