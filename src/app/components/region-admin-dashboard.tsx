import React, { useState, useCallback } from "react";
import useSWR, { SWRConfiguration } from 'swr';
import { County, SubCounty, Equipment } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AnalysisOverview, PaginatedResponse } from "../utils/interfaces";
import { fetcher, countiesFetcher, subCountiesFetcher } from "../utils/fetcher";
import EquipmentDialog from "./equipment-dialog";

interface RegionAdminDashboardProps {
  regionId: string;
}

export const RegionAdminDashboard: React.FC<RegionAdminDashboardProps> = ({ regionId }) => {
  const [expandedCounty, setExpandedCounty] = useState<string | null>(null);
  const [expandedSubCounty, setExpandedSubCounty] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [showWithoutEquipment, setShowWithoutEquipment] = useState(false);
  const [showSubCountiesWithoutEquipment, setShowSubCountiesWithoutEquipment] = useState(false);

  // Fetch data with region filter
  const { data: analysis, error: analysisError } = useSWR<AnalysisOverview>(
    `/api/analysis?regionId=${regionId}`,
    fetcher
  );

  const { data: countiesData, error: countiesError } = useSWR<PaginatedResponse<County>>(
    `/api/counties?page=${page}&limit=${limit}&search=${search}&sortBy=${sortBy}&order=${order}&regionId=${regionId}&withoutEquipment=${showWithoutEquipment}`,
    countiesFetcher as SWRConfiguration<PaginatedResponse<County>>
  );

  const { data: subCounties, error: subCountiesError } = useSWR<SubCounty[]>(
    expandedCounty ? `/api/subcounty?countyId=${expandedCounty}&withoutEquipment=${showSubCountiesWithoutEquipment}` : null,
    subCountiesFetcher
  );

  const { data: equipment, error: equipmentError } = useSWR<Equipment[]>(
    expandedSubCounty ? `/api/equipment?subCountyId=${expandedSubCounty}` : null,
    fetcher
  );

  const handleCountyExpand = useCallback(
    (countyId: string) => {
      setExpandedCounty((prev) => (prev === countyId ? null : countyId));
      setExpandedSubCounty(null);
    },
    []
  );

  const handleSubCountyExpand = useCallback(
    (subCountyId: string) => {
      setExpandedSubCounty((prev) => (prev === subCountyId ? null : subCountyId));
    },
    []
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(parseInt(newLimit));
    setPage(1);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setOrder("asc");
    }
    setPage(1);
  };

  if (analysisError || countiesError || subCountiesError || equipmentError) {
    return (
      <div className="text-red-500 text-center mt-10">
        Error loading data. Please try again later.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Region Admin Dashboard
      </h1>

      {/* Analysis Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {analysis ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Total Equipment</CardTitle>
                <CardDescription>Equipment in your region</CardDescription>
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

      {/* Counties List */}
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Regional Counties and Sub-counties</CardTitle>
            <CardDescription>Manage equipment in your region</CardDescription>

            {/* Filters and Controls */}
            <div className="flex gap-4 mt-4">
              <Input
                placeholder="Search counties..."
                value={search}
                onChange={handleSearch}
                className="max-w-xs"
              />
              <Select value={String(limit)} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="withoutEquipment"
                  checked={showWithoutEquipment}
                  onCheckedChange={(checked) => setShowWithoutEquipment(checked as boolean)}
                />
                <label htmlFor="withoutEquipment">
                  Show counties without equipment
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="subCountiesWithoutEquipment"
                  checked={showSubCountiesWithoutEquipment}
                  onCheckedChange={(checked) => 
                    setShowSubCountiesWithoutEquipment(checked as boolean)
                  }
                />
                <label htmlFor="subCountiesWithoutEquipment">
                  Show sub-counties without equipment
                </label>
              </div>

              <Button
                variant="outline"
                onClick={() => handleSort("name")}
                className="flex items-center gap-2"
              >
                Name {sortBy === "name" && (order === "asc" ? "↑" : "↓")}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {countiesData ? (
              <>
                <Accordion type="single" collapsible>
                  {countiesData.data.map((county) => (
                    <AccordionItem key={county.id} value={county.id}>
                      <AccordionTrigger
                        onClick={() => handleCountyExpand(county.id)}
                        className="text-lg font-medium text-gray-800"
                      >
                        {county.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        {expandedCounty === county.id && subCounties ? (
                          <Accordion type="single" collapsible>
                            {subCounties.map((subCounty) => (
                              <AccordionItem key={subCounty.id} value={subCounty.id}>
                                <AccordionTrigger
                                  onClick={() => handleSubCountyExpand(subCounty.id)}
                                  className="text-green-500"
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
                                    <p className="text-gray-400">
                                      {equipmentError
                                        ? "Error loading equipment"
                                        : "Loading equipment..."}
                                    </p>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <p className="text-gray-400">
                            {subCountiesError
                              ? "Error loading sub-counties"
                              : "Loading sub-counties..."}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * limit) + 1} to{" "}
                    {Math.min(page * limit, countiesData.meta.total)} of{" "}
                    {countiesData.meta.total} counties
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: countiesData.meta.pages }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={page === i + 1 ? "default" : "outline"}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === countiesData.meta.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400">Loading counties...</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Equipment Dialog */}
      <EquipmentDialog
        equipmentId={selectedEquipment || ''}
        open={!!selectedEquipment}
        onOpenChange={(open: boolean) => !open && setSelectedEquipment(null)}
      />
    </div>
  );
};

export default RegionAdminDashboard;