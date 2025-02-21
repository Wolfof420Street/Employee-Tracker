//api/equipment/[id]/route.ts


import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/options';

const prisma = new PrismaClient();

async function checkUserPermissionForEquipment(userId: number, equipmentId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      region: true,
      county: true,
      subCounty: true,
    },
  });

  if (!user) return null;

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
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

  if (!equipment) return null;

  let hasPermission = false;

  switch (user.role) {
    case 'COUNTRY_ADMIN':
      hasPermission = true;
      break;
    case 'REGION_ADMIN':
      hasPermission = 
        equipment.regionId === user.regionId ||
        equipment.county?.regionId === user.regionId ||
        equipment.subCounty?.county.regionId === user.regionId;
      break;
    case 'COUNTY_ADMIN':
      hasPermission = 
        equipment.countyId === user.countyId ||
        equipment.subCounty?.countyId === user.countyId;
      break;
    case 'SUB_COUNTY_USER':
      hasPermission = equipment.subCountyId === user.subCountyId;
      break;
  }

  return hasPermission ? equipment : null;
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

  const equipment = await checkUserPermissionForEquipment(userId, id);

  if (!equipment) {
    return NextResponse.json({ error: 'Equipment not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(equipment);
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

  // Check if user has access to this equipment
  const existingEquipment = await checkUserPermissionForEquipment(userId, id);
  if (!existingEquipment) {
    return NextResponse.json({ error: 'Equipment not found or access denied' }, { status: 404 });
  }

  const data = await request.json();

  // Validate that only one location ID is provided
  const locationIds = [data.regionId, data.countyId, data.subCountyId].filter(Boolean);
  if (locationIds.length !== 1) {
    return NextResponse.json({ 
      error: 'Equipment must be assigned to exactly one administrative level' 
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
    return NextResponse.json({ error: 'Unauthorized to move equipment to this location' }, { status: 403 });
  }

  const equipment = await prisma.equipment.update({
    where: { id },
    data: {
      ...data,
      location: determineEquipmentLocation(data)
    },
    include: {
      region: true,
      county: true,
      subCounty: true,
    }
  });

  return NextResponse.json(equipment);
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

  // Check if user has access to this equipment
  const equipment = await checkUserPermissionForEquipment(userId, id);
  if (!equipment) {
    return NextResponse.json({ error: 'Equipment not found or access denied' }, { status: 404 });
  }

  await prisma.equipment.delete({
    where: { id },
  });

  return NextResponse.json({ message: 'Equipment deleted successfully' });
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

function determineEquipmentLocation(data: any) {
  if (data.regionId) return 'REGION_OFFICE';
  if (data.countyId) return 'COUNTY_OFFICE';
  if (data.subCountyId) return 'SUB_COUNTY_OFFICE';
  return 'NATIONAL_OFFICE';
}