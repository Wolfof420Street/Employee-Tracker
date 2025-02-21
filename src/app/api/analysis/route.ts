// app/api/equipment/analysis/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/options';
import { subYears, subMonths, subWeeks, format } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !['COUNTRY_ADMIN', 'COUNTY_ADMIN', 'REGION_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const countyId = searchParams.get('countyId');
    const regionId = searchParams.get('regionId');
    const timeRange = searchParams.get('timeRange') || '1y'; // Default: 1 year

    let whereClause: any = {};
    if (session.user.role === 'COUNTY_ADMIN' && countyId) {
      whereClause = { subCounty: { countyId } };
    } 

    // Basic Metrics
    const totalEquipment =  await prisma.equipment.count({ where: whereClause });
    const equipmentByCondition = await prisma.equipment.groupBy({
      by: ['condition'],
      where: whereClause,
      _count: true,
    });
    const equipmentByType = await prisma.equipment.groupBy({
      by: ['type'],
      where: whereClause,
      _count: true,
    });

    const activeEquipment =
      totalEquipment -
      (equipmentByCondition.find((e) => e.condition === 'OUT_OF_SERVICE')?._count || 0);
    const needsMaintenance =
      equipmentByCondition.find((e) => e.condition === 'NEEDS_REPAIR')?._count || 0;

   // Time-Series Data
const acquisitions = await generateTimeSeriesData(
  (await prisma.equipment.findMany({
    where: {
      ...whereClause,
      purchaseDate: { not: null },
    },
    select: { purchaseDate: true },
  })).filter(item => item.purchaseDate !== null) as { purchaseDate: Date }[],
  timeRange
);

    // Maintenance Metrics
    const maintenanceMetrics = await calculateMaintenanceMetrics(whereClause);

    if (session.user.role === 'REGION_ADMIN' && regionId) {
      return NextResponse.json(await getRegionData(regionId));
    }

    // Return Data
    return NextResponse.json({
      overview: {
        totalEquipment,
        activeEquipment,
        needsMaintenance,
      },
      distributions: {
        byType: equipmentByType,
        byCondition: equipmentByCondition,
      },
      timeSeries: {
        acquisitions,
      },
      maintenance: maintenanceMetrics,
    });
  } catch (error) {
    if(error instanceof Error) {
      console.error(error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}

async function generateTimeSeriesData(equipment: { purchaseDate: Date }[], timeRange: string): Promise<{ date: string; count: number }[]> {
  let startDate: Date;

  switch (timeRange) {
    case '1y':
      startDate = subYears(new Date(), 1);
      break;
    case '6m':
      startDate = subMonths(new Date(), 6);
      break;
    case '3m':
      startDate = subMonths(new Date(), 3);
      break;
    case '1m':
      startDate = subMonths(new Date(), 1);
      break;
    case '1w':
      startDate = subWeeks(new Date(), 1);
      break;
    default:
      throw new Error('Invalid time range');
  }

  const groupedData: Record<string, number> = {};

  for (const item of equipment) {
    if (item.purchaseDate >= startDate) {
      const dateKey = format(item.purchaseDate, 'yyyy-MM-dd');
      groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
    }
  }

  return Object.entries(groupedData).map(([date, count]) => ({ date, count }));
}



async function getRegionData(regionId: string) {
  // Get all equipment in the region including those in counties
  const whereClause = {
    OR: [
      { regionId },
      { county: { regionId } },
      { subCounty: { county: { regionId } } }
    ]
  };

  // Basic Metrics
  const totalEquipment = await prisma.equipment.count({ where: whereClause });
  
  const equipmentByCondition = await prisma.equipment.groupBy({
    by: ['condition'],
    where: whereClause,
    _count: true,
  });

  const equipmentByType = await prisma.equipment.groupBy({
    by: ['type'],
    where: whereClause,
    _count: true,
  });

  // Calculate active and maintenance numbers
  const activeEquipment = totalEquipment - 
    (equipmentByCondition.find(e => e.condition === 'OUT_OF_SERVICE')?._count || 0);
  const needsMaintenance = 
    equipmentByCondition.find(e => e.condition === 'NEEDS_REPAIR')?._count || 0;

  // Get acquisition time series data
  const equipmentWithDates = await prisma.equipment.findMany({
    where: {
      ...whereClause,
      purchaseDate: { not: null },
    },
    select: { purchaseDate: true },
  });

  const acquisitions = await generateTimeSeriesData(
    equipmentWithDates.filter(item => item.purchaseDate !== null) as { purchaseDate: Date }[],
    '1y' // Default to 1 year view
  );

  // Get maintenance metrics
  const maintenanceMetrics = await calculateMaintenanceMetrics(whereClause);

  // Get county-level breakdown
  const counties = await prisma.county.findMany({
    where: { regionId },
    include: {
      _count: {
        select: { equipments: true }
      }
    }
  });

  const countyData = await Promise.all(counties.map(async (county) => {
    const equipmentConditions = await prisma.equipment.groupBy({
      by: ['condition'],
      where: { countyId: county.id },
      _count: true,
    });

    return {
      id: county.id,
      name: county.name,
      totalEquipment: county._count.equipments,
      equipmentConditions: equipmentConditions.reduce((acc, curr) => {
        acc[curr.condition] = curr._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }));

  return {
    overview: {
      totalEquipment,
      activeEquipment,
      needsMaintenance,
    },
    distributions: {
      byType: equipmentByType,
      byCondition: equipmentByCondition,
    },
    timeSeries: {
      acquisitions,
    },
    maintenance: maintenanceMetrics,
    counties: countyData,
  };
}

async function calculateMaintenanceMetrics(whereClause: any) {
  // Modify the where clause to properly handle the equipment -> subCounty relation
  const maintenanceWhereClause = whereClause.subCounty 
    ? {
        equipment: {
          subCounty: whereClause.subCounty
        }
      }
    : {};

  const totalRepairs = await prisma.maintenance.count({
    where: maintenanceWhereClause
  });

  const repairDurations = await prisma.maintenance.findMany({
    where: maintenanceWhereClause,
    select: {
      maintenanceDate: true,
      resolvedDate: true,
    },
  });

  type Repair = {
    maintenanceDate: Date;
    resolvedDate: Date | null;
  };

  const totalRepairTime = repairDurations.reduce((sum: number, repair: Repair) => {
    if (repair.maintenanceDate && repair.resolvedDate) {
      return sum + (repair.resolvedDate.getTime() - repair.maintenanceDate.getTime());
    }
    return sum;
  }, 0);

  // Add average repair time calculation
  const completedRepairs = repairDurations.filter(repair => repair.resolvedDate !== null);
  const averageRepairTime = completedRepairs.length > 0 
    ? totalRepairTime / completedRepairs.length 
    : 0;

  // Add percentage of resolved repairs
  const resolvedPercentage = totalRepairs > 0 
    ? (completedRepairs.length / totalRepairs) * 100 
    : 0;

  return {
    totalRepairs,
    totalRepairTime,
    averageRepairTime,
    resolvedPercentage,
    completedRepairs: completedRepairs.length,
    pendingRepairs: totalRepairs - completedRepairs.length
  };
}


 

