import React, { useState, useCallback } from "react";
import useSWR from "swr";
import { fetcher, subCountiesFetcher } from "../utils/fetcher";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { SubCounty, Equipment } from "@prisma/client";
import { AnalysisOverview } from "../utils/interfaces";
import EquipmentDialog from "./equipment-dialog";

interface CountyAdminDashboardProps {
  countyId: string;
}

export const CountyAdminDashboard: React.FC<CountyAdminDashboardProps> = ({
  countyId,
}) => {
  const [expandedSubCounty, setExpandedSubCounty] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);


  // Separate error states for analysis and subcounties
  const { data: analysis, error: analysisError } = useSWR<AnalysisOverview>(
    `/api/analysis?countyId=${countyId}`,
    fetcher,
    {
      shouldRetryOnError: false // Prevent infinite retries
    }
  );

  // Fetch data
  const { data: subCounties, error: subCountiesError } = useSWR<SubCounty[]>(
    `/api/subcounty?countyId=${countyId}`,
    subCountiesFetcher
  );

  const { data: equipment, error: equipmentError } = useSWR<Equipment[]>(
    expandedSubCounty ? `/api/equipment?subCountyId=${expandedSubCounty}` : null,
    fetcher
  );

  const handleSubCountyExpand = useCallback(
    (subCountyId: string) => {
      setExpandedSubCounty((prev) => (prev === subCountyId ? null : subCountyId));
    },
    []
  );

  if (subCountiesError || equipmentError) {
    return (
      <div className="text-red-500 text-center mt-10">
        Error loading data. Please try again later.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        County Admin Dashboard
      </h1>


      {/* Analysis Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {analysisError ? (
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-yellow-600">Analytics Temporarily Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">We're having trouble loading the analytics. Please try again later.</p>
            </CardContent>
          </Card>
        ) : analysis ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Total Equipment</CardTitle>
                <CardDescription>Overview of all equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  {analysis.overview.totalEquipment}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Equipment</CardTitle>
                <CardDescription>Currently operational</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {analysis.overview.activeEquipment}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Needs Maintenance</CardTitle>
                <CardDescription>Equipment requiring repairs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-600">
                  {analysis.overview.needsMaintenance}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </>
        )}
      </section>


      {/* Sub-counties Section */}
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sub-counties</CardTitle>
            <CardDescription>Manage equipment by sub-county</CardDescription>
          </CardHeader>




          <CardContent>
            {subCounties ? (
              <Accordion type="single" collapsible>
                {subCounties.map((subCounty) => (
                  <AccordionItem key={subCounty.id} value={subCounty.id}>
                    <AccordionTrigger
                      onClick={() => handleSubCountyExpand(subCounty.id)}
                      className="text-lg font-medium text-green-500"
                    >
                      {subCounty.name}
                    </AccordionTrigger>
                    <AccordionContent>
                      {expandedSubCounty === subCounty.id && equipment ? (
                        equipment.length > 0 ? (
                          <ul className="space-y-2">
                            {equipment.map((item) => (
                              <li
                                key={item.id}
                                className="text-gray-500 text-sm p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => setSelectedEquipment(item.id)}
                              >
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-sm">No equipment available</p>
                        )
                      ) : (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Skeleton className="h-36 w-full" />
            )}
          </CardContent>
        </Card>
      </section>

      <EquipmentDialog
        equipmentId={selectedEquipment || ''}
        open={!!selectedEquipment}
        onOpenChange={(open: Boolean) => !open && setSelectedEquipment(null)}
      />

    </div>
  );
};
