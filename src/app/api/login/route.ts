import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accessKey } = body

    if (!accessKey) {
      return NextResponse.json({ error: "Access key is required" }, { status: 400 })
    }

    // First, try to find a sub-county with the given access key
    const subCounty = await prisma.subCounty.findUnique({
      where: { accessKey },
      include: {
        user: true,
        county: true,
      },
    })

    if (subCounty && subCounty.user) {
      return NextResponse.json({
        id: subCounty.user.id.toString(),
        role: subCounty.user.role,
        name: subCounty.name,
        countyId: subCounty.countyId,
        subCountyId: subCounty.id,
      })
    }

    // If no sub-county is found, check if it's a county admin
    const county = await prisma.county.findFirst({
      where: {
        subCounties: {
          some: { accessKey },
        },
      },
      include: {
        subCounties: {
          where: { accessKey },
          include: { user: true },
        },
      },
    })

    if (county && county.subCounties[0] && county.subCounties[0].user) {
      const subCounty = county.subCounties[0]
      return NextResponse.json({
        id: subCounty.user.id.toString(),
        role: subCounty.user.role,
        name: county.name,
        countyId: county.id,
        subCountyId: subCounty.id,
      })
    }

    // If still not found, check if it's a country admin
    const countryAdmin = await prisma.user.findFirst({
      where: {
        role: "COUNTRY_ADMIN",
        subCounty: {
          accessKey,
        },
      },
      include: {
        subCounty: true,
      },
    })

    if (countryAdmin) {
      return NextResponse.json({
        id: countryAdmin.id.toString(),
        role: "COUNTRY_ADMIN",
        name: "Country Admin",
        subCountyId: countryAdmin.subCountyId,
      })
    }

    // If no user is found with the given access key
    return NextResponse.json({ error: "Invalid access key" }, { status: 401 })
    
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}

