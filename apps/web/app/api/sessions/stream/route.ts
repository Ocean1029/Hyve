// app/api/sessions/stream/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getSessionStreamDataService } from '@/modules/sessions/service';

/**
 * @swagger
 * /api/sessions/stream:
 *   get:
 *     summary: Stream real-time focus session updates
 *     description: "Server-Sent Events (SSE) stream that provides real-time focus session status updates. Sends initial active sessions status and then polls every 2 seconds for updates when session pause status changes or session ends. Note: This endpoint returns a text/event-stream response that may not be fully testable in Swagger UI."
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: SSE stream with session status updates
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             example: |
 *               data: {"type":"session_status","sessions":[{"id":"session-1","status":"active","isPaused":false,"users":[{"userId":"alex-chen","isPaused":false}]}]}
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

    const userId = session.user.id;

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Track if controller is closed to prevent sending to closed stream
        let isClosed = false;

        // Send initial active sessions status
        const sendSessionStatus = async () => {
          // Check if controller is already closed
          if (isClosed) {
            return;
          }

          try {
            const result = await getSessionStreamDataService(userId);

            // Check again before sending (controller might have closed during async operations)
            if (isClosed) {
              return;
            }

            if (result.success) {
              const data = JSON.stringify({ 
                type: 'session_status', 
                sessions: result.sessions 
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } catch (error: any) {
            // Ignore errors if controller is closed (client disconnected)
            if (error?.code === 'ERR_INVALID_STATE' || error?.message?.includes('closed')) {
              isClosed = true;
              return;
            }
            console.error('Error sending session status:', error);
          }
        };

        // Send initial status
        await sendSessionStatus();

        // Poll for updates every 2 seconds for better responsiveness
        const interval = setInterval(async () => {
          if (isClosed) {
            clearInterval(interval);
            return;
          }
          try {
            await sendSessionStatus();
          } catch (error: any) {
            // Ignore errors if controller is closed
            if (error?.code === 'ERR_INVALID_STATE' || error?.message?.includes('closed')) {
              isClosed = true;
              clearInterval(interval);
              return;
            }
            console.error('Error in session status polling:', error);
            clearInterval(interval);
            isClosed = true;
            try {
              controller.close();
            } catch (closeError) {
              // Ignore errors when closing already closed controller
            }
          }
        }, 2000); // Update every 2 seconds for better sync

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          isClosed = true;
          clearInterval(interval);
          try {
            controller.close();
          } catch (error) {
            // Ignore errors when closing already closed controller
          }
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
    console.error('Error in session stream route:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

