import { Skeleton } from "@/components/ui/skeleton"; // Assuming ShadCN's Skeleton component is here

export function LoadingDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Loading your dashboard...</h1>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-3/4 rounded-lg" />
        <Skeleton className="h-12 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}
