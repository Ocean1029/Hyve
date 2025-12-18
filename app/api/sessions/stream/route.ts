// app/api/sessions/stream/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

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
            // Get all active sessions for this user
            const activeSessions = await prisma.focusSession.findMany({
              where: {
                status: 'active',
                users: {
                  some: {
                    userId: userId,
                  },
                },
              },
              include: {
                users: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            });

            // Format session status
            const sessionStatuses = activeSessions.map((session: any) => {
              const hasAnyPaused = session.users.some((su: any) => su.isPaused);
              return {
                sessionId: session.id,
                status: session.status,
                isPaused: hasAnyPaused,
                startTime: session.startTime,
                endTime: session.endTime,
                minutes: session.minutes,
                users: session.users.map((su: any) => ({
                  userId: su.userId,
                  userName: su.user.name,
                  userImage: su.user.image,
                  isPaused: su.isPaused,
                })),
              };
            });
            
            // Also check for recently completed sessions (within last minute) that the user participated in
            // This helps catch sessions that just ended
            // Use endTime instead of updatedAt since FocusSession doesn't have updatedAt field
            const recentlyCompletedSessions = await prisma.focusSession.findMany({
              where: {
                status: 'completed',
                users: {
                  some: {
                    userId: userId,
                  },
                },
                endTime: {
                  gte: new Date(Date.now() - 60000), // Last minute
                },
              },
              include: {
                users: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      },
                    },
                  },
                },
              },
              take: 5,
            });
            
            // Add completed sessions to the list
            recentlyCompletedSessions.forEach((session: any) => {
              sessionStatuses.push({
                sessionId: session.id,
                status: session.status,
                isPaused: false,
                startTime: session.startTime,
                endTime: session.endTime,
                minutes: session.minutes,
                users: session.users.map((su: any) => ({
                  userId: su.userId,
                  userName: su.user.name,
                  userImage: su.user.image,
                  isPaused: false,
                })),
              });
            });

            // Check again before sending (controller might have closed during async operations)
            if (isClosed) {
              return;
            }

            const data = JSON.stringify({ 
              type: 'session_status', 
              sessions: sessionStatuses 
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
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

