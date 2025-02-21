-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('NATIONAL_ADMIN', 'COUNTRY_ADMIN', 'COUNTY_ADMIN', 'SUB_COUNTY_USER', 'REGION_ADMIN');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('LAPTOP', 'DESKTOP', 'PRINTER', 'SCANNER', 'PROJECTOR', 'NETWORK_DEVICE', 'VEHICLE', 'PHOTO_COPIER', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentLocation" AS ENUM ('NATIONAL_OFFICE', 'REGION_OFFICE', 'COUNTY_OFFICE', 'SUB_COUNTY_OFFICE');

-- CreateEnum
CREATE TYPE "StaffLocation" AS ENUM ('NATIONAL_OFFICE', 'REGION_OFFICE', 'COUNTY_OFFICE', 'SUB_COUNTY_OFFICE');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('GOOD', 'NEEDS_REPAIR', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "TermsOfService" AS ENUM ('PERMANENT', 'CONTRACT', 'TEMPORARY');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL,
    "accessKey" TEXT NOT NULL,
    "regionId" TEXT,
    "countyId" TEXT,
    "subCountyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "County" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCounty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCounty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "condition" "EquipmentCondition" NOT NULL,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "location" "EquipmentLocation" NOT NULL,
    "regionId" TEXT,
    "countyId" TEXT,
    "subCountyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "repairCost" DOUBLE PRECISION,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "otherNames" TEXT,
    "gender" "Gender" NOT NULL,
    "personalNumber" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobGroup" TEXT NOT NULL,
    "csg" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "dateHired" TIMESTAMP(3) NOT NULL,
    "dateOfPost" TIMESTAMP(3) NOT NULL,
    "termsOfService" "TermsOfService" NOT NULL,
    "location" "StaffLocation" NOT NULL,
    "regionId" TEXT,
    "countyId" TEXT,
    "subCountyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_accessKey_key" ON "User"("accessKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_role_regionId_key" ON "User"("role", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_role_countyId_key" ON "User"("role", "countyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_role_subCountyId_key" ON "User"("role", "subCountyId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "County_name_key" ON "County"("name");

-- CreateIndex
CREATE UNIQUE INDEX "County_name_regionId_key" ON "County"("name", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCounty_name_countyId_key" ON "SubCounty"("name", "countyId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_serialNumber_key" ON "Equipment"("serialNumber");

-- CreateIndex
CREATE INDEX "Equipment_type_idx" ON "Equipment"("type");

-- CreateIndex
CREATE INDEX "Equipment_location_idx" ON "Equipment"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_personalNumber_key" ON "Staff"("personalNumber");

-- CreateIndex
CREATE INDEX "Staff_personalNumber_idx" ON "Staff"("personalNumber");

-- CreateIndex
CREATE INDEX "Staff_jobTitle_idx" ON "Staff"("jobTitle");

-- CreateIndex
CREATE INDEX "Staff_jobGroup_idx" ON "Staff"("jobGroup");

-- CreateIndex
CREATE INDEX "Staff_location_idx" ON "Staff"("location");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subCountyId_fkey" FOREIGN KEY ("subCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "County" ADD CONSTRAINT "County_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCounty" ADD CONSTRAINT "SubCounty_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_subCountyId_fkey" FOREIGN KEY ("subCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_subCountyId_fkey" FOREIGN KEY ("subCountyId") REFERENCES "SubCounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
