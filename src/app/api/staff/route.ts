import { NextResponse } from 'next/server'
import { PrismaClient, UserRole, StaffLocation } from '@prisma/client'
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/options'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      region: true,
      county: true,
      subCounty: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url)
  const locationFilter = searchParams.get('location') as StaffLocation | null
  const regionIdParam = searchParams.get('regionId')
  const countyIdParam = searchParams.get('countyId')
  const subcountyIdParam = searchParams.get('subCountyId')

  let whereClause: any = {}

  // Build the where clause based on user role and location parameters
  switch (session.user.role) {
    case 'COUNTRY_ADMIN':
    case 'NATIONAL_ADMIN':
      if (locationFilter) whereClause.location = locationFilter
      if (regionIdParam) whereClause.regionId = regionIdParam
      if (countyIdParam) whereClause.countyId = countyIdParam
      if (subcountyIdParam) whereClause.subCountyId = subcountyIdParam
      break;

    case 'REGION_ADMIN':
      if (!user.regionId) {
        return NextResponse.json({ error: 'User not associated with a region' }, { status: 400 })
      }
      whereClause.OR = [
        { regionId: user.regionId },
        { county: { regionId: user.regionId } },
        { subCounty: { county: { regionId: user.regionId } } }
      ]
      if (locationFilter) whereClause.location = locationFilter
      if (countyIdParam) whereClause.countyId = countyIdParam
      if (subcountyIdParam) whereClause.subCountyId = subcountyIdParam
      break;

    case 'COUNTY_ADMIN':
      if (!user.countyId) {
        return NextResponse.json({ error: 'User not associated with a county' }, { status: 400 })
      }
      whereClause.OR = [
        { countyId: user.countyId },
        { subCounty: { countyId: user.countyId } }
      ]
      if (locationFilter) whereClause.location = locationFilter
      if (subcountyIdParam) whereClause.subCountyId = subcountyIdParam
      break;

    case 'SUB_COUNTY_USER':
      if (!user.subCountyId) {
        return NextResponse.json({ error: 'User not associated with a sub-county' }, { status: 400 })
      }
      whereClause.subCountyId = user.subCountyId
      break;

    default:
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 })
  }

  const staff = await prisma.staff.findMany({
    where: whereClause,
    include: {
      region: true,
      county: true,
      subCounty: true,
    }
  })

  return NextResponse.json(staff)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      region: true,
      county: true,
      subCounty: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const data = await request.json()

  // Validate that only one location ID is provided
  const locationIds = [data.regionId, data.countyId, data.subCountyId].filter(Boolean)
  if (locationIds.length !== 1) {
    return NextResponse.json({
      error: 'Staff must be assigned to exactly one administrative level'
    }, { status: 400 })
  }

  // Validate user permissions based on role and location
  let hasPermission = false;
  switch (session.user.role) {
    case 'COUNTRY_ADMIN':
    case 'NATIONAL_ADMIN':
      hasPermission = true;
      break;
    case 'REGION_ADMIN':
      hasPermission = data.regionId === user.regionId ||
        (typeof data.countyId === 'string' && await isCountyInRegion(data.countyId, user.regionId ?? "")) ||
        (typeof data.subCountyId === 'string' && await isSubCountyInRegion(data.subCountyId, user.regionId ?? ""));
      break;
    case 'COUNTY_ADMIN':
      hasPermission = data.countyId === user.countyId ||
        (typeof data.subCountyId === 'string' && await isSubCountyInCounty(data.subCountyId, user.countyId ?? ""));
      break;
    case 'SUB_COUNTY_USER':
      hasPermission = data.subCountyId === user.subCountyId;
      break;
  }

  if (!hasPermission) {
    return NextResponse.json({ error: 'Unauthorized to create staff at this location' }, { status: 403 })
  }

  const staff = await prisma.staff.create({
    data: {
      ...data,
      location: determineStaffLocation(data),
    }
  })

  return NextResponse.json(staff)
}

// Helper functions
async function isCountyInRegion(countyId: string, regionId: string): Promise<boolean> {
  const county = await prisma.county.findUnique({
    where: { id: countyId },
    select: { regionId: true }
  })
  return county?.regionId === regionId
}

async function isSubCountyInRegion(subCountyId: string, regionId: string): Promise<boolean> {
  const subCounty = await prisma.subCounty.findUnique({
    where: { id: subCountyId },
    include: { county: true }
  })
  return subCounty?.county.regionId === regionId
}

async function isSubCountyInCounty(subCountyId: string, countyId: string): Promise<boolean> {
  const subCounty = await prisma.subCounty.findUnique({
    where: { id: subCountyId },
    select: { countyId: true }
  })
  return subCounty?.countyId === countyId
}

function determineStaffLocation(data: any): StaffLocation {
  if (data.regionId) return StaffLocation.REGION_OFFICE
  if (data.countyId) return StaffLocation.COUNTY_OFFICE
  if (data.subCountyId) return StaffLocation.SUB_COUNTY_OFFICE
  return StaffLocation.NATIONAL_OFFICE
}

