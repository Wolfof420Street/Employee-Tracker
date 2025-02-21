import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Barcode, Activity, Box } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "../utils/fetcher";
import { EquipmentCondition } from '../utils/interfaces';



interface EquipmentDialogProps {
  equipmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EquipmentDialog: React.FC<EquipmentDialogProps> = ({ equipmentId, open, onOpenChange }) => {
  const { data: equipment, error } = useSWR(
    open ? `/api/equipment/${equipmentId}` : null,
    fetcher
  );

  const getConditionColor = (condition: EquipmentCondition) => {
    const colors: Record<EquipmentCondition, string> = {
      GOOD: "bg-blue-500",
      OUT_OF_SERVICE: "bg-red-500",
      NEEDS_REPAIR: "bg-orange-500"
    };
    return colors[condition] || "bg-gray-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Equipment Details
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="text-red-500">Failed to load equipment details</div>
        ) : !equipment ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{equipment.name}</h3>
                <Badge className={`${getConditionColor(equipment.condition as EquipmentCondition)} text-white`}>
                  {equipment.condition.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{equipment.type.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Serial Number</p>
                    <p className="font-medium">{equipment.serialNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Purchase Date</p>
                    <p className="font-medium">
                      {equipment.purchaseDate 
                        ? new Date(equipment.purchaseDate).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">
                      {new Date(equipment.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDialog;