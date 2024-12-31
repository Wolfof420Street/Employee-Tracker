import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { checkAuth } from "@/app/utils/auth"


const prisma = new PrismaClient()

// GET /api/equipment/[id]

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {

    const user = await checkAuth(req)
    if (!user || user instanceof NextResponse) return user;

    const { id } = params

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { subCounty: { include: { county: true } } },
    })
  
    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    if (user.role === "SUB_COUNTY_USER" && equipment.subCountyId !== user.subCountyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    } 


    return NextResponse.json(equipment)


}

// PUT /api/equipment/[id]

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {

    const user = await checkAuth(req)
    if (!user || user instanceof NextResponse) return user;

    const { id } = params

    const equipment = await prisma.equipment.findUnique({
      where: { id },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    if (user.role === "SUB_COUNTY_USER" && equipment.subCountyId !== user.subCountyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    } 

    const body = await req.json()
    const { name, type, condition, serialNumber, purchaseDate } = body

    if (!name || !type || !condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: { name, type, condition, serialNumber, purchaseDate },
    })

    return NextResponse.json(updatedEquipment)

}

// DELETE /api/equipment/[id]

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {

    const user = await checkAuth(req)
    if (!user || user instanceof NextResponse) return user;

    const { id } = params

    const equipment = await prisma.equipment.findUnique({
      where: { id },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    if (user.role === "SUB_COUNTY_USER" && equipment.subCountyId !== user.subCountyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    } 

    await prisma.equipment.delete({ where: { id } })

    return NextResponse.json({ message: "Equipment deleted" })

}



