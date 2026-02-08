import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Validate request body against a Zod schema
 * Returns validated data or error response
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        })
        .join(', ');

      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: `Validation error: ${errorMessage}` },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      ),
    };
  }
}
