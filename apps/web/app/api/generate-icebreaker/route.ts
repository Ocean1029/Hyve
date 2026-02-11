import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { GenerateIcebreakerRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * @swagger
 * /api/generate-icebreaker:
 *   post:
 *     summary: Generate conversation starter question
 *     description: Generate a single, short, fun conversation starter question using Google Gemini AI based on context
 *     tags:
 *       - AI
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateIcebreakerRequest'
 *           example:
 *             context: "college students hanging out"
 *     responses:
 *       200:
 *         description: Successfully generated icebreaker question
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateIcebreakerResponse'
 *             example:
 *               question: "What's the best meal you've had this week?"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or AI service error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateIcebreakerResponse'
 *             example:
 *               question: "If you could travel anywhere right now, where would you go?"
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, GenerateIcebreakerRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { context } = validation.data;

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