// utils/equipmentAnalysis.ts
import { PrismaClient } from '@prisma/client';
import { SubCounty, Equipment, County } from './interfaces';

const prisma = new PrismaClient();

interface AnalysisResult {
  countyName: string;
  subCountyName: string;
  missingEquipmentTypes: string[];
  totalEquipment: number;
  hasAllEquipment: boolean;
}

interface EquipmentSummary {
  totalSubCounties: number;
  subCountiesWithAllEquipment: number;
  subCountiesWithMissingEquipment: number;
  mostCommonMissingEquipment: MissingEquipmentStat[];
}

interface MissingEquipmentStat {
  type: string;
  count: number;
  percentage: number;
}

interface AnalysisOutput {
  analysis: AnalysisResult[];
  summary: EquipmentSummary;
}

interface SubCountyWithEquipment {
    id: string;
    name: string;
    countyId: string;
    createdAt: Date;
    updatedAt: Date;
    county: Pick<County, 'name'>;
    equipments: Pick<Equipment, 'type'>[];
  }

export async function analyzeEquipmentDistribution(countyId?: string): Promise<AnalysisOutput> {
  try {
    // Query to find sub-counties with missing equipment types
    const subCountiesWithoutEquipment: SubCountyWithEquipment[] = await prisma.subCounty.findMany({
      where: {
        ...(countyId && { countyId }),
      },
      include: {
        county: {
          select: {
            name: true,
          },
        },
        equipments: {
          select: {
            type: true,
          },
        },
      },
    });

    // Get all unique equipment types in the system
    const allEquipmentTypes: { type: string }[] = await prisma.equipment.findMany({
      select: {
        type: true,
      },
      distinct: ['type'],
    });

    const equipmentTypeSet = new Set(allEquipmentTypes.map(e => e.type));

    // Analyze missing equipment for each sub-county
    const analysis: AnalysisResult[] = subCountiesWithoutEquipment.map((subCounty) => {
      const existingTypes = new Set(subCounty.equipments.map(e => e.type));
      const missingTypes = Array.from(equipmentTypeSet).filter(type => !existingTypes.has(type));

      return {
        countyName: subCounty.county.name,
        subCountyName: subCounty.name,
        missingEquipmentTypes: missingTypes,
        totalEquipment: subCounty.equipments.length,
        hasAllEquipment: missingTypes.length === 0,
      };
    });

    // Generate summary statistics
    const summary: EquipmentSummary = {
      totalSubCounties: subCountiesWithoutEquipment.length,
      subCountiesWithAllEquipment: analysis.filter(a => a.hasAllEquipment).length,
      subCountiesWithMissingEquipment: analysis.filter(a => !a.hasAllEquipment).length,
      mostCommonMissingEquipment: getMostCommonMissingEquipment(analysis),
    };

    return {
      analysis,
      summary,
    };
  } catch (error) {
    console.error('Error analyzing equipment distribution:', error);
    throw error;
  }
}

function getMostCommonMissingEquipment(analysis: AnalysisResult[]): MissingEquipmentStat[] {
  const missingCount: Record<string, number> = {};
  
  analysis.forEach(item => {
    item.missingEquipmentTypes.forEach((type: string) => {
      missingCount[type] = (missingCount[type] || 0) + 1;
    });
  });

  return Object.entries(missingCount)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]): MissingEquipmentStat => ({
      type,
      count,
      percentage: (count / analysis.length) * 100,
    }));
}

interface EquipmentStatusCount {
  type: string;
  condition: string;
  _count: number;
}

// Function to get equipment status by sub-county
export async function getSubCountyEquipmentStatus(subCountyId: string): Promise<EquipmentStatusCount[]> {
  return prisma.equipment.groupBy({
    by: ['type', 'condition'],
    where: {
      subCountyId,
    },
    _count: true,
  });
}

interface SubCountyWithCounty {
    id: string;
    name: string;
    countyId: string;
    createdAt: Date;
    updatedAt: Date;
    county: Pick<County, 'name'>;
    equipments: Equipment[];
  }

// Function to get all sub-counties missing specific equipment type
export async function getSubCountiesMissingEquipment(
  equipmentType: string, 
  countyId?: string
): Promise<SubCountyWithCounty[]> {
  const subCounties = await prisma.subCounty.findMany({
    where: {
      ...(countyId && { countyId }),
      NOT: {
        equipments: {
          some: {
            type: equipmentType,
          },
        },
      },
    },
    include: {
      county: {
        select: {
          name: true,
        },
      },
    },
  });

  return subCounties;
}