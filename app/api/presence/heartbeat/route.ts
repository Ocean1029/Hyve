// app/api/presence/heartbeat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateUserHeartbeatService } from '@/modules/presence/service';

/**
 * POST /api/presence/heartbeat
 * Update current user's last seen timestamp
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await updateUserHeartbeatService(session.user.id);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in heartbeat route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



