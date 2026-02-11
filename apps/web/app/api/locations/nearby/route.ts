// app/api/locations/nearby/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNearbyOnlineUsersService } from '@/modules/locations/service';

/**
 * @swagger
 * /api/locations/nearby:
 *   get:
 *     summary: Find nearby online users
 *     description: Get online users within a radius (km) of the given coordinates.
 *     tags:
 *       - Locations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *       - in: query
 *         name: radiusKm
 *         required: false
 *         schema:
 *           type: number
 *           default: 1
 *         description: Radius in kilometers
 *     responses:
 *       200:
 *         description: List of nearby online users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NearbyUsersResponse'
 *       400:
 *         description: Missing or invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', users: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('latitude');
    const lngParam = searchParams.get('longitude');
    const radiusParam = searchParams.get('radiusKm');

    if (latParam === null || lngParam === null) {
      return NextResponse.json(
        { success: false, error: 'latitude and longitude are required', users: [] },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latParam);
    const longitude = parseFloat(lngParam);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude', users: [] },
        { status: 400 }
      );
    }

    const radiusKm = radiusParam ? parseFloat(radiusParam) : 1;
    const radius = Number.isNaN(radiusKm) || radiusKm <= 0 ? 1 : Math.min(radiusKm, 100);

    const result = await getNearbyOnlineUsersService(
      session.user.id,
      latitude,
      longitude,
      radius
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, users: [] },
        { status: 500 }
      );
    }

    const users = (result.users ?? []).map(
      (u: {
        id: string;
        userId?: string | null;
        name?: string | null;
        image?: string | null;
        isOnline?: boolean;
        distance?: number;
        lastSeenAt?: Date | null;
      }) => ({
        id: u.id,
        userId: u.userId ?? null,
        name: u.name ?? null,
        image: u.image ?? null,
        isOnline: u.isOnline ?? false,
        distance: u.distance,
        lastSeenAt:
          u.lastSeenAt instanceof Date ? u.lastSeenAt.toISOString() : u.lastSeenAt ?? null,
      })
    );
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error getting nearby users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', users: [] },
      { status: 500 }
    );
  }
}
