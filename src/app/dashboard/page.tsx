"use client"

import { redirect, useRouter } from "next/navigation"
import { CountyAdminDashboard } from "../components/county-admin-dashboard"
import { SubCountyUserDashboard } from "../components/sub-county-user-dashboard"
import { CountryAdminDashboard } from "../components/country-admin-dashboard"
import { RegionAdminDashboard } from "../components/region-admin-dashboard"
import { useState, useEffect } from "react"
import { LoadingDashboard } from "../components/loading-dashboard"
import { User, UserRole } from "../utils/interfaces"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/user");
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const rawData = await response.json();
        // Match the raw data structure exactly
        const userData: User = {
          ...rawData,
          role: rawData.role || UserRole.COUNTRY_ADMIN // Default to COUNTRY_ADMIN if undefined
        };
        
        console.log('Processed user data:', userData);
        setUser(userData);

        
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/error");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  if (loading) return <LoadingDashboard />;
  if (!user) return redirect("/login");

  console.log('Rendering with role:', user.role);
  
  switch (user.role) {
    case UserRole.COUNTRY_ADMIN:
      return <CountryAdminDashboard />;
    case UserRole.COUNTY_ADMIN:
      return <CountyAdminDashboard countyId={user.countyId!} />;
    case UserRole.SUB_COUNTY_USER:
      return <SubCountyUserDashboard subCountyId={user.subCountyId!} />;
    case UserRole.REGION_ADMIN:
      return <RegionAdminDashboard regionId={user.regionId!} />;
    default:
      console.error('Role not matched in switch:', user.role);
      return <div>Invalid user role</div>;
  }
}