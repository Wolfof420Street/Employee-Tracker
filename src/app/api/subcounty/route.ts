import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/options';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const countyId = searchParams.get('countyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';
    const withoutEquipment = searchParams.get('withoutEquipment') === 'true';

    if (!countyId) {
      return NextResponse.json({ error: 'County ID is required' }, { status: 400 });
    }

    const whereClause = {
      countyId,
      name: {
        contains: search,
        mode: 'insensitive' as const,
      },
      ...(withoutEquipment && {
        equipments: {
          none: {},
        },
      }),
    };

    const subCounties = await prisma.subCounty.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        _count: {
          select: { equipments: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.subCounty.count({
      where: whereClause,
    });

    const formattedSubCounties = subCounties.map(({ _count, ...subCounty }) => ({
      ...subCounty,
      equipmentCount: _count.equipments,
    }));

    return NextResponse.json({
      data: formattedSubCounties,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sub-counties:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-counties' }, { status: 500 });
  }
}
