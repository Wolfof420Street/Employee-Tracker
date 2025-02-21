export enum UserRole {
  NATIONAL_ADMIN = 'NATIONAL_ADMIN',
  COUNTRY_ADMIN = 'COUNTRY_ADMIN',
  COUNTY_ADMIN = 'COUNTY_ADMIN',
  SUB_COUNTY_USER = 'SUB_COUNTY_USER',
  REGION_ADMIN = 'REGION_ADMIN'
}

export enum EquipmentType {
  LAPTOP = 'LAPTOP',
  DESKTOP = 'DESKTOP',
  PRINTER = 'PRINTER',
  SCANNER = 'SCANNER',
  PROJECTOR = 'PROJECTOR',
  NETWORK_DEVICE = 'NETWORK_DEVICE',
  VEHICLE = 'VEHICLE',
  PHOTO_COPIER = 'PHOTO_COPIER',
  OTHER = 'OTHER'
}

export enum EquipmentCondition {
  GOOD = 'GOOD',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export enum EquipmentLocation {
  NATIONAL_OFFICE = 'NATIONAL_OFFICE',
  REGION_OFFICE = 'REGION_OFFICE',
  COUNTY_OFFICE = 'COUNTY_OFFICE',
  SUB_COUNTY_OFFICE = 'SUB_COUNTY_OFFICE'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum TermsOfService {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY'
}

export interface User {
  id: number;
  role: UserRole;
  accessKey: string;
  regionId?: string | null;    // For REGION_ADMIN
  countyId?: string | null;    // For COUNTY_ADMIN
  subCountyId?: string | null; // For SUB_COUNTY_USER
  createdAt: Date;
  updatedAt: Date;
  region?: Region | null;      // For REGION_ADMIN
  county?: County | null;      // For COUNTY_ADMIN
  subCounty?: SubCounty | null; // For SUB_COUNTY_USER
}

export interface Region {
  id: string;
  name: string;
  counties: County[];
  users: User[];  // REGION_ADMIN users
  createdAt: Date;
  updatedAt: Date;
}

export interface County {
  id: string;
  name: string;
  regionId: string;
  createdAt: Date;
  updatedAt: Date;
  region: Region;
  subCounties: SubCounty[];
  users: User[];  // COUNTY_ADMIN users
  equipments: Equipment[];
}

export interface SubCounty {
  id: string;
  name: string;
  countyId: string;
  createdAt: Date;
  updatedAt: Date;
  county: County;
  users: User[];  // SUB_COUNTY_USER users
  equipments: Equipment[];
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  condition: EquipmentCondition;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  location: EquipmentLocation;
  regionId?: string | null;
  countyId?: string | null;
  subCountyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: string;
  surname: string;
  firstName: string;
  otherNames?: string | null;
  gender: Gender;
  personalNumber: string;
  jobTitle: string;
  jobGroup: string;
  csg: string;
  birthDate: Date;
  dateHired: Date;
  dateOfPost: Date;
  termsOfService: TermsOfService;
  location: EquipmentLocation;
  regionId?: string | null;
  countyId?: string | null;
  subCountyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Maintenance {
  id: string;
  equipmentId: string;
  maintenanceDate: Date;
  description: string;
  repairCost?: number | null;
  resolved: boolean;
  resolvedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisOverview {
  overview: {
    totalEquipment: number;
    activeEquipment: number;
    needsMaintenance: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
