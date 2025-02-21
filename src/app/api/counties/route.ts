import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const withoutEquipment = url.searchParams.get('withoutEquipment') === 'true';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const search = url.searchParams.get('search') || '';
  const sortBy = url.searchParams.get('sortBy') || 'name';
  const order = url.searchParams.get('order') === 'desc' ? 'desc' : 'asc';
  const regionId = url.searchParams.get('regionId'); // New parameter

  try {
    const counties = await prisma.county.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
        ...(withoutEquipment && {
          equipments: {
            none: {},
          },
        }),
        ...(regionId && {
          regionId: regionId,
        }),
      },
      include: {
        region: true, // Optionally include region details
      },
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.county.count({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
        ...(withoutEquipment && {
          equipments: {
            none: {},
          },
        }),
        ...(regionId && {
          regionId: regionId,
        }),
      },
    });

    return NextResponse.json({
      data: counties,
      meta: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching counties:', error);
    return NextResponse.json({ error: 'Failed to fetch counties' }, { status: 500 });
  }
}