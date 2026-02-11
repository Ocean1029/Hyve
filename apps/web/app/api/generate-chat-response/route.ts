import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { GenerateChatResponseRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * @swagger
 * /api/generate-chat-response:
 *   post:
 *     summary: Generate AI chat response
 *     description: Generate a casual, short chat response using Google Gemini AI based on friend's name, bio, and last message
 *     tags:
 *       - AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateChatResponseRequest'
 *           example:
 *             friendName: "Kai"
 *             friendBio: "A creative student who loves music"
 *             lastMessage: "Hey, want to grab coffee?"
 *     responses:
 *       200:
 *         description: Successfully generated chat response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateChatResponseResponse'
 *             example:
 *               replyText: "sounds good!"
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
 *               $ref: '#/components/schemas/GenerateChatResponseResponse'
 *             example:
 *               replyText: "🔥"
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, GenerateChatResponseRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { friendName, friendBio, lastMessage } = validation.data;

    const bioDescription = friendBio && friendBio.trim() 
      ? `described as "${friendBio}"` 
      : 'a student';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are ${friendName}, ${bioDescription}. 
      Reply to the following text message from your close friend. 
      Keep it short (under 20 words), casual, lowercase if it fits the vibe, and match your personality.
      The message is: "${lastMessage}"`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed is priority here
      }
    });

    const replyText = response.text || "Sounds good!";

    return NextResponse.json({ replyText });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    // Fallback reply
    return NextResponse.json({ replyText: "🔥" });
  }
}

