// app/api/sessions/stream/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getSessionStreamDataService } from '@/modules/sessions/service';

/**
 * GET /api/sessions/stream
 * Server-Sent Events stream for real-time focus session status updates
 * Sends updates when session pause status changes or session ends
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

