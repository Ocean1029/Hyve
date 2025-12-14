// app/api/presence/stream/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getFriendsStatusService } from '@/modules/presence/service';

/**
 * GET /api/presence/stream
 * Server-Sent Events stream for real-time presence updates
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

