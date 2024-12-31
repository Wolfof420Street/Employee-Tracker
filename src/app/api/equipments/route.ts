import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkAuth, checkPermission } from "@/app/utils/auth";


const prisma = new PrismaClient();

// GET /api/equipment
export async function GET(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user || user instanceof NextResponse) return user;

  let equipment;

  if (user.role === "SUB_COUNTY_USER") {
    equipment = await prisma.equipment.findMany({
      where: { subCountyId: user.subCountyId },
    });
  } else if (user.role === "COUNTY_ADMIN") {
    const subCounty = await prisma.subCounty.findUnique({
        where: { id: user.subCountyId },
        select: { countyId: true },
      });
      if (!subCounty) {
        return NextResponse.json({ error: "Sub-county not found" }, { status: 404 });
      }
      equipment = await prisma.equipment.findMany({
        where: { subCounty: { countyId: subCounty.countyId } },
        include: { subCounty: true },
      });
      
  } else if (user.role === "COUNTRY_ADMIN") {
    equipment = await prisma.equipment.findMany({
      include: { subCounty: { include: { county: true } } },
    });
  } else {
    return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
  }

  return NextResponse.json(equipment);
}

// POST /api/equipment
export async function POST(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user || user instanceof NextResponse) return user;

  const permissionResponse = checkPermission(user, ["SUB_COUNTY_USER"]);
  if (permissionResponse) return permissionResponse;

  const body = await req.json();
  const { name, type, condition, serialNumber, purchaseDate } = body;

  if (!name || !type || !condition) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const newEquipment = await prisma.equipment.create({
      data: {
        name,
        type,
        condition,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        subCountyId: user.subCountyId!,
      },
    });

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json({ error: "Error creating equipment" }, { status: 500 });
  }
}