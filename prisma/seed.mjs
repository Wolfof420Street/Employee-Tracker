
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const usedAccessKeys = new Set();

// Helper function to generate 6-digit access key
const generateAccessKey = () => {
  let accessKey;
  do {
    // Generate a random number between 100000 and 999999
    accessKey = Math.floor(100000 + Math.random() * 900000).toString();
  } while (usedAccessKeys.has(accessKey));

  usedAccessKeys.add(accessKey);
  return accessKey;
};

const regionsData = [
  {
    name: "Coastal Region",
    counties: [
      {
        name: "Mombasa",
        subCounties: ["Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni", "Mvita"],
      },
      {
        name: "Kwale",
        subCounties: ["Matuga", "Msambweni", "Kinango", "Lunga Lunga"],
      },
      {
        name: "Kilifi",
        subCounties: [
          "Kilifi North",
          "Kilifi South",
          "Kaloleni",
          "Rabai",
          "Ganze",
          "Malindi",
          "Magarini",
        ],
      },
      {
        name: "Tana River",
        subCounties: ["Bura", "Galole", "Garsen"],
      },
      {
        name: "Lamu",
        subCounties: ["Lamu East", "Lamu West"],
      },
      {
        name: "Taita-Taveta",
        subCounties: ["Mwatate", "Wundanyi", "Voi", "Taveta"],
      },
    ],
  },
  {
    name: "North Eastern Region",
    counties: [
      {
        name: "Garissa",
        subCounties: ["Garissa Township", "Balambala", "Lagdera", "Dadaab", "Fafi", "Ijara"],
      },
      {
        name: "Wajir",
        subCounties: [
          "Wajir East",
          "Wajir West",
          "Wajir North",
          "Wajir South",
          "Tarbaj",
          "Eldas",
        ],
      },
      {
        name: "Mandera",
        subCounties: [
          "Mandera East",
          "Mandera West",
          "Mandera North",
          "Mandera South",
          "Lafey",
          "Banisa",
        ],
      },
    ],
  },
  {
    name: "Eastern Region",
    counties: [
      {
        name: "Marsabit",
        subCounties: ["Moyale", "North Horr", "Saku", "Laisamis"],
      },
      {
        name: "Isiolo",
        subCounties: ["Isiolo Central", "Merti", "Garbatulla"],
      },
      {
        name: "Meru",
        subCounties: [
          "Igembe South",
          "Igembe Central",
          "Igembe North",
          "Tigania East",
          "Tigania West",
          "North Imenti",
          "Central Imenti",
          "South Imenti",
          "Buuri",
        ],
      },
      {
        name: "Tharaka-Nithi",
        subCounties: [
          "Tharaka North",
          "Tharaka South",
          "Chuka",
          "Maara",
          "Igambang'ombe",
        ],
      },
      {
        name: "Embu",
        subCounties: ["Embu North", "Embu West", "Runyenjes", "Mbeere North", "Mbeere South"],
      },
      {
        name: "Kitui",
        subCounties: [
          "Kitui Central",
          "Kitui West",
          "Kitui South",
          "Kitui East",
          "Mwingi Central",
          "Mwingi West",
          "Mwingi North",
        ],
      },
      {
        name: "Machakos",
        subCounties: [
          "Machakos Town",
          "Mwala",
          "Yatta",
          "Kangundo",
          "Kathiani",
          "Matungulu",
          "Masinga",
          "Athi River",
        ],
      },
      {
        name: "Makueni",
        subCounties: [
          "Makueni",
          "Kaiti",
          "Kilome",
          "Mbooni East",
          "Mbooni West",
          "Kibwezi East",
          "Kibwezi West",
          "Nzaui",
          "Kathonzweni",
        ],
      },
    ],
  },
  {
    name: "Central Region",
    counties: [
      {
        name: "Nyandarua",
        subCounties: ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Jorok", "Ndaragwa"],
      },
      {
        name: "Nyeri",
        subCounties: [
          "Nyeri Town",
          "Mathira East",
          "Mathira West",
          "Kieni East",
          "Kieni West",
          "Tetu",
          "Mukurweini",
          "Othaya",
        ],
      },
      {
        name: "Kirinyaga",
        subCounties: ["Kirinyaga Central", "Gichugu", "Mwea East", "Mwea West", "Ndia"],
      },
      {
        name: "Murang'a",
        subCounties: [
          "Kangema",
          "Mathioya",
          "Kigumo",
          "Kandara",
          "Maragua",
          "Gatanga",
          "Ithanga - Kakuzi",
        ],
      },
      {
        name: "Kiambu",
        subCounties: [
          "Kiambu Town",
          "Thika Town",
          "Ruiru",
          "Juja",
          "Gatundu North",
          "Gatundu South",
          "Limuru",
          "Lari",
          "Kikuyu",
          "Kabete",
          "Kiambaa",
          "Githunguri",
        ],
      },
    ],
  },
  {
    name: "Rift Valley Region",
    counties: [
      {
        name: "Turkana",
        subCounties: [
          "Turkana South",
          "Turkana North",
          "Turkana West",
          "Turkana East",
          "Loima",
          "Kibish",
        ],
      },
      {
        name: "West Pokot",
        subCounties: ["West Pokot", "Pokot South", "Sigor", "Kacheliba"],
      },
      {
        name: "Samburu",
        subCounties: ["Samburu East", "Samburu North", "Samburu Central"],
      },
      {
        name: "Trans-Nzoia",
        subCounties: ["Kiminini", "Saboti", "Endebess", "Cherangany", "Kwanza"],
      },
      {
        name: "Uasin Gishu",
        subCounties: ["Ainabkoi", "Kapseret", "Kesses", "Turbo", "Moiben", "Soy"],
      },
      {
        name: "Elgeyo-Marakwet",
        subCounties: [
          "Keiyo North",
          "Keiyo South",
          "Marakwet East",
          "Marakwet West",
        ],
      },
      {
        name: "Nandi",
        subCounties: [
          "Nandi Hills",
          "Chesumei",
          "Aldai",
          "Emgwen",
          "Mosop",
          "Tinderet",
        ],
      },
      {
        name: "Baringo",
        subCounties: [
          "Baringo North",
          "Baringo Central",
          "Baringo South",
          "Mogotio",
          "Eldama Ravine",
          "Tiaty",
        ],
      },
      {
        name: "Laikipia",
        subCounties: ["Laikipia East", "Laikipia North", "Laikipia West"],
      },
      {
        name: "Nakuru",
        subCounties: [
          "Nakuru Town East",
          "Nakuru Town West",
          "Naivasha",
          "Gilgil",
          "Molo",
          "Njoro",
          "Rongai",
          "Subukia",
          "Bahati",
          "Kuresoi South",
          "Kuresoi North",
        ],
      },
      {
        name: "Narok",
        subCounties: [
          "Narok East",
          "Narok West",
          "Narok North",
          "Narok South",
          "Transmara East",
          "Transmara West",
        ],
      },
      {
        name: "Kajiado",
        subCounties: [
          "Kajiado Central",
          "Kajiado North",
          "Kajiado West",
          "Kajiado East",
          "Kajiado South",
        ],
      },
      {
        name: "Kericho",
        subCounties: [
          "Ainamoi",
          "Belgut",
          "Bureti",
          "Kipkelion East",
          "Kipkelion West",
          "Soin Sigowet",
        ],
      },
      {
        name: "Bomet",
        subCounties: [
          "Chepalungu",
          "Bomet Central",
          "Bomet East",
          "Konoin",
          "Sotik",
        ],
      },
    ],
  },
  {
    name: "Western Region",
    counties: [
      {
        name: "Kakamega",
        subCounties: [
          "Lugari",
          "Likuyani",
          "Malava",
          "Lurambi",
          "Navakholo",
          "Mumias East",
          "Mumias West",
          "Matungu",
          "Butere",
          "Khwisero",
          "Shinyalu",
          "Ikolomani",
        ],
      },
      {
        name: "Vihiga",
        subCounties: ["Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya"],
      },
      {
        name: "Bungoma",
        subCounties: [
          "Mt Elgon",
          "Sirisia",
          "Kabuchai",
          "Bumula",
          "Kanduyi",
          "Webuye East",
          "Webuye West",
          "Tongaren",
          "Kimilili",
        ],
      },
      {
        name: "Busia",
        subCounties: [
          "Teso North",
          "Teso South",
          "Nambale",
          "Matayos",
          "Butula",
          "Funyula",
          "Bunyala",
        ],
      },
    ],
  },
  {
    name: "Nyanza Region",
    counties: [
      {
        name: "Siaya",
        subCounties: ["Rarieda", "Bondo", "Alego Usonga", "Gem", "Ugenya", "Ugunja"],
      },
      {
        name: "Kisumu",
        subCounties: [
          "Kisumu East",
          "Kisumu West",
          "Kisumu Central",
          "Nyando",
          "Muhoroni",
          "Seme",
          "Nyakach",
        ],
      },
      {
        name: "Homa Bay",
        subCounties: [
          "Homa Bay Town",
          "Rachuonyo South",
          "Rachuonyo East",
          "Rachuonyo North",
          "Rangwe",
          "Ndhiwa",
          "Mbita",
          "Suba",
        ],
      },
      {
        name: "Migori",
        subCounties: [
          "Rongo",
          "Awendo",
          "Suna East",
          "Suna West",
          "Uriri",
          "Nyatike",
          "Kuria East",
          "Kuria West",
        ],
      },
      {
        name: "Kisii",
        subCounties: [
          "Kitutu Chache North",
          "Kitutu Chache South",
          "Nyaribari Chache",
          "Nyaribari Masaba",
          "Bobasi",
          "Bomachoge Borabu",
          "Bomachoge Chache",
          "South Mugirango",
        ],
      },
      {
        name: "Nyamira",
        subCounties: [
          "Borabu",
          "Manga",
          "Masaba North",
          "West Mugirango",
          "Nyamira North",
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding data...");


  // Create a COUNTRY_ADMIN user with access key
  const countryAdmin = await prisma.user.create({
    data: {
      role: 'COUNTRY_ADMIN',
      subCountyId: null,
      accessKey: generateAccessKey(),
    },
  });

  console.log('Created COUNTRY_ADMIN:', countryAdmin);

  for (const regionData of regionsData) {
    // Create a region
    const region = await prisma.region.create({
      data: {
        name: regionData.name,
      },
    });

    console.log(`Created Region: ${region.name}`);

    // Create a REGION_ADMIN user with access key
    const regionAdmin = await prisma.user.create({
      data: {
        role: "REGION_ADMIN",
        regionId: region.id,
        accessKey: generateAccessKey(),
      },
    });

    console.log(`Created REGION_ADMIN for Region: ${region.name}`, regionAdmin);

    for (const countyData of regionData.counties) {
      // Create a county
      const county = await prisma.county.create({
        data: {
          name: countyData.name,
          regionId: region.id,
        },
      });

      console.log(`Created County: ${county.name} in Region: ${region.name}`);

      // Create a COUNTY_ADMIN user for the county with access key
      const countyAdmin = await prisma.user.create({
        data: {
          role: "COUNTY_ADMIN",
          countyId: county.id,
          accessKey: generateAccessKey(),
        },
      });

      console.log(
        `Created COUNTY_ADMIN for County: ${county.name} in Region: ${region.name}`,
        countyAdmin
      );

      for (const subCountyName of countyData.subCounties) {
        // Create a sub-county
        const subCounty = await prisma.subCounty.create({
          data: {
            name: subCountyName,
            countyId: county.id,
          },
        });

        console.log(
          `Created Sub-County: ${subCounty.name} in County: ${county.name} in Region: ${region.name}`
        );

        // Create a SUB_COUNTY_USER for the sub-county with access key
        const subCountyUser = await prisma.user.create({
          data: {
            role: "SUB_COUNTY_USER",
            subCountyId: subCounty.id,
            accessKey: generateAccessKey(),
          },
        });

        console.log(
          `Created SUB_COUNTY_USER for Sub-County: ${subCounty.name} in County: ${county.name} in Region: ${region.name}`,
          subCountyUser
        );
      }
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
