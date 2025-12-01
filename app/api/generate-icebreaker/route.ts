import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { context = "college students hanging out" } = await request.json();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a single, short, fun, and non-cringe conversation starter question for ${context}.
      It should be suitable for close friends or new acquaintances.
      Keep it under 20 words. Do not include quotes.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed is priority here
      }
    });

    const question = response.text || "What's the best meal you've had this week?";

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback question
    const fallbackQuestion = "If you could travel anywhere right now, where would you go?";
    return NextResponse.json({ question: fallbackQuestion });
  }
}