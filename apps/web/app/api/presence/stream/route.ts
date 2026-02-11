// app/api/presence/stream/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getFriendsStatusService } from '@/modules/presence/service';

/**
 * @swagger
 * /api/presence/stream:
 *   get:
 *     summary: Stream real-time presence updates
 *     description: "Server-Sent Events (SSE) stream that provides real-time presence updates for friends. Sends initial status and then polls every 10 seconds for updates. Note: This endpoint returns a text/event-stream response that may not be fully testable in Swagger UI."
 *     tags:
 *       - Presence
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: SSE stream with presence updates
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             example: |
 *               data: {"type":"status","statuses":[{"userId":"kai-user","isOnline":true,"lastSeenAt":"2024-01-15T14:30:00Z"}]}
 *               
 *       401:
 *         description: Unauthorized
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract userId after validation to ensure type safety
    const userId = session.user.id;

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial status
        const sendStatus = async () => {
          try {
            const statuses = await getFriendsStatusService(userId);
            const data = JSON.stringify({ type: 'status', statuses });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            console.error('Error sending status:', error);
          }
        };

        // Send initial status
        await sendStatus();

        // Poll for updates every 10 seconds
        const interval = setInterval(async () => {
          try {
            await sendStatus();
          } catch (error) {
            console.error('Error in status polling:', error);
            clearInterval(interval);
            controller.close();
          }
        }, 10000); // Update every 10 seconds

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for nginx
      },
    });
  } catch (error) {
    console.error('Error in stream route:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

