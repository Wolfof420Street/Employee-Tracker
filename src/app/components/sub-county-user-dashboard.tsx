"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Edit, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import { Equipment, EquipmentType, EquipmentCondition} from "../utils/interfaces";


// Type for form data without the computed/auto-generated fields
type EquipmentFormData = {
  name: string;
  type: EquipmentType;
  condition: EquipmentCondition;
  serialNumber?: string;
  purchaseDate?: string;
};

interface SubCountyAdminDashboardProps {
  subCountyId: string;
}


// Props type for the EquipmentRow component
interface EquipmentRowProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
}

// Props type for the EquipmentForm component
interface EquipmentFormProps {
  formData: EquipmentFormData;
  onChange: (field: keyof EquipmentFormData, value: string) => void;
}

const EquipmentRow = memo(({ equipment, onEdit, onDelete }: EquipmentRowProps) => (
  <TableRow>
    <TableCell>{equipment.name}</TableCell>
    <TableCell>{equipment.condition}</TableCell>
    <TableCell>{equipment.type}</TableCell>
    <TableCell>
      {equipment.purchaseDate 
        ? new Date(equipment.purchaseDate).toLocaleDateString() 
        : 'N/A'}
    </TableCell>
    <TableCell>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(equipment)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(equipment.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
));
EquipmentRow.displayName = 'EquipmentRow';

const EquipmentForm = memo(({ formData, onChange }: EquipmentFormProps) => (
  <div className="space-y-4">
    <Input
      placeholder="Name"
      value={formData.name}
      onChange={(e) => onChange('name', e.target.value)}
    />
    <select
      className="w-full p-2 border rounded"
      value={formData.condition}
      onChange={(e) => onChange('condition', e.target.value as EquipmentCondition)}
    >
      <option value="">Select Condition</option>
      {Object.values(EquipmentCondition).map((condition) => (
        <option key={condition} value={condition}>
          {condition.replace('_', ' ')}
        </option>
      ))}
    </select>
    <select
      className="w-full p-2 border rounded"
      value={formData.type}
      onChange={(e) => onChange('type', e.target.value as EquipmentType)}
    >
      <option value="">Select Type</option>
      {Object.values(EquipmentType).map((type) => (
        <option key={type} value={type}>
          {type.replace('_', ' ')}
        </option>
      ))}
    </select>
    <Input
      placeholder="Serial Number"
      value={formData.serialNumber || ''}
      onChange={(e) => onChange('serialNumber', e.target.value)}
    />
    <Input
      placeholder="Purchase Date"
      type="date"
      value={formData.purchaseDate || ''}
      onChange={(e) => onChange('purchaseDate', e.target.value)}
    />
  </div>
));
EquipmentForm.displayName = 'EquipmentForm';

export const SubCountyUserDashboard : React.FC<SubCountyAdminDashboardProps> = ({ subCountyId }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: "",
    type: EquipmentType.OTHER,
    condition: EquipmentCondition.GOOD,
    serialNumber: "",
    purchaseDate: "",
  });

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/equipment?subCountyId=" + subCountyId);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data: Equipment[] = await response.json();
      setEquipment(data);
    } catch (error) {
      toast.error("Failed to load equipment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleAddOrEdit = async () => {
    try {
      const url = currentEquipment 
        ? `/api/equipment/${currentEquipment.id}`
        : '/api/equipment';
      
      // Transform dates for API
      const apiData = {
        ...formData,
        purchaseDate: formData.purchaseDate 
          ? new Date(formData.purchaseDate).toISOString() 
          : null,
        subCountyId: currentEquipment?.subCountyId || subCountyId, // Replace with actual ID
      };

      const response = await fetch(url, {
        method: currentEquipment ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) throw new Error('Failed to save equipment');
      
      toast.success(`Equipment ${currentEquipment ? 'updated' : 'added'} successfully.`);
      await fetchEquipment();
      setShowDialog(false);
    } catch (error) {
      toast.error("Failed to save equipment.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete equipment');
      
      toast.success("Equipment deleted successfully.");
      setEquipment(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      toast.error("Failed to delete equipment.");
    }
  };

  const handleFormChange = useCallback((field: keyof EquipmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const openDialog = useCallback((equipment?: Equipment) => {
    if (equipment) {
      setCurrentEquipment(equipment);
      setFormData({
        name: equipment.name,
        type: equipment.type,
        condition: equipment.condition,
        serialNumber: equipment.serialNumber || '',
        purchaseDate: equipment.purchaseDate 
          ? new Date(equipment.purchaseDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setCurrentEquipment(null);
      setFormData({
        name: "",
        type: EquipmentType.OTHER,
        condition: EquipmentCondition.GOOD,
        serialNumber: "",
        purchaseDate: "",
      });
    }
    setShowDialog(true);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Sub-County Equipment</h1>
        <Button onClick={() => openDialog()}>Add Equipment</Button>
      </div>

      {loading ? (
        <Skeleton className="h-10 w-full mb-4" />
      ) : equipment.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Purchase Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment.map((equip) => (
              <EquipmentRow
                key={equip.id}
                equipment={equip}
                onEdit={openDialog}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No equipment found.</p>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentEquipment ? "Edit Equipment" : "Add Equipment"}
            </DialogTitle>
          </DialogHeader>
          <EquipmentForm formData={formData} onChange={handleFormChange} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOrEdit}>
              {currentEquipment ? "Save Changes" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};