import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => {
      throw new Error('Invalid JSON in request body');
    });

    // Validate access key
    const { accessKey } = body;
    if (!accessKey || typeof accessKey !== 'string') {
      return NextResponse.json(
        { error: "Access key is required" },
        { status: 400 }
      );
    }

    // Validate NEXTAUTH_SECRET
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not configured');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { accessKey },
      include: {
        county: true,
        subCounty: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid access key" },
        { status: 401 }
      );
    }

    // Determine name based on role
    let name = "User";
    if (user.role === "COUNTRY_ADMIN") {
      name = "Country Admin";
    } else if (user.role === "COUNTY_ADMIN" && user.county) {
      name = user.county.name;
    } else if (user.role === "SUB_COUNTY_USER" && user.subCounty) {
      name = user.subCounty.name;
    }

    // Create JWT token
    const token = sign(
      {
        id: user.id,
        role: user.role,
        // Add additional claims if needed
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Token created successfully for user:', user.id);

    // Return success response
    return NextResponse.json({
      token,
      user: {
        id: user.id.toString(),
        role: user.role,
        name,
        countyId: user.countyId?.toString() || null,
        subCountyId: user.subCountyId?.toString() || null,
      }
    });

  } catch (error) {
    // Structured error logging
    const errorObj = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
    console.error("Login error:", errorObj);

    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}