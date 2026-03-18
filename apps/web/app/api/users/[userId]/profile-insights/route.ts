import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getProfileInsights } from '@/modules/profile/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { userId } = await params;
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 },
      );
    }

    const insights = await getProfileInsights(userId);

    return NextResponse.json({ success: true, ...insights });
  } catch (error) {
    console.error('Error getting profile insights:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
