import { PrismaClient } from '@prisma/client';
import { createObjectCsvWriter } from 'csv-writer';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Function to generate a random access key
const generateAccessKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Define the counties and sub-counties
const counties = [
  {
    name: "Nairobi",
    subCounties: [
      { name: "Nairobi Central" },
      { name: "Westlands" },
      { name: "Kamukunji" },
      { name: "Lang'ata" },
    ],
  },
  {
    name: "Kiambu",
    subCounties: [
      { name: "Kiambu Town" },
      { name: "Gatundu North" },
      { name: "Gatundu South" },
      { name: "Juja" },
    ],
  },
  // Add more counties and sub-counties here
];

async function seed() {
  const countyAccessKeys: { county: string; subCounty: string; accessKey: string }[] = [];

  // Loop through the counties and sub-counties
  for (const countyData of counties) {
    // Create the county and generate its access key
    const county = await prisma.county.create({
      data: {
        name: countyData.name,
        accessKey: generateAccessKey(),
      },
    });

    // Create the sub-counties for each county
    for (const subCountyData of countyData.subCounties) {
      const subCounty = await prisma.subCounty.create({
        data: {
          name: subCountyData.name,
          countyId: county.id,
        },
      });

      // Store the county, sub-county, and access key information
      countyAccessKeys.push({
        county: county.name,
        subCounty: subCountyData.name,
        accessKey: county.accessKey,
      });
    }
  }

  // Write the access keys to a CSV file
  const csvWriter = createObjectCsvWriter({
    path: 'county_access_keys.csv',
    header: [
      { id: 'county', title: 'County' },
      { id: 'subCounty', title: 'SubCounty' },
      { id: 'accessKey', title: 'AccessKey' },
    ],
  });

  await csvWriter.writeRecords(countyAccessKeys);

  console.log('Database seeded and access keys saved to county_access_keys.csv');
}

seed()
  .catch(e => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
