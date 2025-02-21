import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/options';

const prisma = new PrismaClient();

async function checkUserPermissionForStaff(userId: number, staffId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      region: true,
      county: true,
      subCounty: true,
    },
  });

  if (!user) return null;

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      region: true,
      county: {
        include: { region: true }
      },
      subCounty: {
        include: { county: true }
      }
    },
  });

  if (!staff) return null;

  let hasPermission = false;

  switch (user.role) {
    case 'COUNTRY_ADMIN':
    case 'NATIONAL_ADMIN':
      hasPermission = true;
      break;
    case 'REGION_ADMIN':
      hasPermission = 
        staff.regionId === user.regionId ||
        staff.county?.regionId === user.regionId ||
        staff.subCounty?.county.regionId === user.regionId;
      break;
    case 'COUNTY_ADMIN':
      hasPermission = 
        staff.countyId === user.countyId ||
        staff.subCounty?.countyId === user.countyId;
      break;
    case 'SUB_COUNTY_USER':
      hasPermission = staff.subCountyId === user.subCountyId;
      break;
  }

  return hasPermission ? staff : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
  }

  const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
  
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
  }

  const staff = await checkUserPermissionForStaff(userId, id);

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(staff);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
  }

  const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
  
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
  }

  // Check if user has access to this staff member
  const existingStaff = await checkUserPermissionForStaff(userId, id);
  if (!existingStaff) {
    return NextResponse.json({ error: 'Staff not found or access denied' }, { status: 404 });
  }

  const data = await request.json();

  // Validate that only one location ID is provided
  const locationIds = [data.regionId, data.countyId, data.subCountyId].filter(Boolean);
  if (locationIds.length !== 1) {
    return NextResponse.json({ 
      error: 'Staff must be assigned to exactly one administrative level' 
    }, { status: 400 });
  }

  // Additional permission check for the new location
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      region: true,
      county: true,
      subCounty: true,
    },
  });

  let hasPermissionForNewLocation = false;
  switch (user?.role) {
    case 'COUNTRY_ADMIN':
    case 'NATIONAL_ADMIN':
      hasPermissionForNewLocation = true;
      break;
    case 'REGION_ADMIN':
      hasPermissionForNewLocation = 
        data.regionId === user.regionId ||
        (data.countyId && await isCountyInRegion(data.countyId, user.regionId ?? "")) ||
        (data.subCountyId && await isSubCountyInRegion(data.subCountyId, user.regionId ?? ""));
      break;
    case 'COUNTY_ADMIN':
      hasPermissionForNewLocation = 
        data.countyId === user.countyId ||
        (data.subCountyId && await isSubCountyInCounty(data.subCountyId, user.countyId ?? ""));
      break;
    case 'SUB_COUNTY_USER':
      hasPermissionForNewLocation = data.subCountyId === user.subCountyId;
      break;
  }

  if (!hasPermissionForNewLocation) {
    return NextResponse.json({ error: 'Unauthorized to move staff to this location' }, { status: 403 });
  }

  const staff = await prisma.staff.update({
    where: { id },
    data: {
      ...data,
      location: determineStaffLocation(data)
    },
    include: {
      region: true,
      county: true,
      subCounty: true,
    }
  });

  return NextResponse.json(staff);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
  }

  const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
  
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
  }

  // Check if user has access to this staff member
  const staff = await checkUserPermissionForStaff(userId, id);
  if (!staff) {
    return NextResponse.json({ error: 'Staff not found or access denied' }, { status: 404 });
  }

  await prisma.staff.delete({
    where: { id },
  });

  return NextResponse.json({ message: 'Staff deleted successfully' });
}

// Helper functions
async function isCountyInRegion(countyId: string, regionId: string): Promise<boolean> {
  const county = await prisma.county.findUnique({
    where: { id: countyId },
    select: { regionId: true }
  });
  return county?.regionId === regionId;
}

async function isSubCountyInRegion(subCountyId: string, regionId: string): Promise<boolean> {
  const subCounty = await prisma.subCounty.findUnique({
    where: { id: subCountyId },
    include: { county: true }
  });
  return subCounty?.county.regionId === regionId;
}

async function isSubCountyInCounty(subCountyId: string, countyId: string): Promise<boolean> {
  const subCounty = await prisma.subCounty.findUnique({
    where: { id: subCountyId },
    select: { countyId: true }
  });
  return subCounty?.countyId === countyId;
}

function determineStaffLocation(data: any) {
  if (data.regionId) return 'REGION_OFFICE';
  if (data.countyId) return 'COUNTY_OFFICE';
  if (data.subCountyId) return 'SUB_COUNTY_OFFICE';
  return 'NATIONAL_OFFICE';
}

