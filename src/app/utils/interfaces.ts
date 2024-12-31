export interface User {
    id: number;
    role: string; // 'ADMIN' or 'USER'
    subCountyId: string;
    createdAt: Date;
    updatedAt: Date;
    subCounty?: SubCounty | null;
  }
  
  export interface County {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    subCounties: SubCounty[];
  }
  
  export interface SubCounty {
    id: string;
    name: string;
    accessKey: string;
    countyId: string;
    createdAt: Date;
    updatedAt: Date;
    county: County;
    user?: User | null;
    equipments: Equipment[];
  }
  
  export interface Equipment {
    id: string;
    name: string;
    type: string;
    condition: string; // e.g., "Good", "Needs Repair", "Out of Service"
    serialNumber?: string | null;
    purchaseDate?: Date | null;
    subCountyId: string;
    createdAt: Date;
    updatedAt: Date;
    subCounty: SubCounty;
  }