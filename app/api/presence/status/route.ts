// app/api/presence/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFriendsStatusService } from '@/modules/presence/service';

/**
 * GET /api/presence/status
 * Get online status for all friends of the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const statuses = await getFriendsStatusService(session.user.id);
    
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error in status route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


