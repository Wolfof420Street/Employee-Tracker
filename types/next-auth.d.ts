import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "COUNTRY_ADMIN" | "COUNTY_ADMIN" | "SUB_COUNTY_USER"
      countyId?: string
      subCountyId?: string
    } & DefaultSession["user"]
  }

 
  interface User {
    id: string;
    role: "COUNTRY_ADMIN" | "COUNTY_ADMIN" | "SUB_COUNTY_USER";
    countyId?: string;
    subCountyId?: string;
  }

}

