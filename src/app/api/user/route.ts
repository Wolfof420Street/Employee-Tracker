import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/options';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }

    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        county: true,
        subCounty: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasPermission = 
      session.user.role === 'COUNTRY_ADMIN' ||
      session.user.id === user.id ||
      (session.user.role === 'REGION_ADMIN' && user.regionId === user.regionId) ||
      (session.user.role === 'COUNTY_ADMIN' && user.countyId === user.countyId) ||
      (session.user.role === 'SUB_COUNTY_USER' && user.subCountyId === user.subCountyId);

    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized - Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({
      ...user,
      role: user.role || 'COUNTRY_ADMIN' // Provide default role if missing
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}