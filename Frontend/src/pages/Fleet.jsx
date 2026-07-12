import { useState, useMemo } from "react";
import { useOperations } from "../context/OperationsContext.jsx";
import { getStatusBadge } from "../components/ui/badge.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table.jsx";
import { Dialog } from "../components/ui/dialog.jsx";
import { Input } from "../components/ui/input.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Filter, Info } from "lucide-react";

// Form validation schema matching backend expectations
const vehicleSchema = z.object({
  registrationNumber: z.string().trim().min(2, "Registration number is too short"),
  vehicleNameModel: z.string().trim().min(2, "Name & model description is required"),
  type: z.string().trim().min(2, "Vehicle type is required"),
  maximumLoadCapacityKg: z.coerce.number().positive("Capacity must be a positive number"),
  odometer: z.coerce.number().nonnegative("Odometer reading cannot be negative"),
  acquisitionCost: z.coerce.number().nonnegative("Acquisition cost cannot be negative"),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]),
  region: z.string().trim().optional(),
});

export default function Fleet() {
  const { vehicles, createVehicle, loading } = useOperations();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: "",
      vehicleNameModel: "",
      type: "Truck",
      maximumLoadCapacityKg: 500,
      odometer: 0,
      acquisitionCost: 10000,
      status: "Available",
      region: "",
    },
  });

  const onSubmit = async (data) => {
    const success = await createVehicle(data);
    if (success) {
      setIsOpen(false);
      reset();
    }
  };

  // Perform client-side filter and search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch = 
        v.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicle_name_model?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = typeFilter === "" || v.type === typeFilter;
      const matchStatus = statusFilter === "" || v.status === statusFilter;
      
      return matchSearch && matchType && matchStatus;
    });
  }, [vehicles, searchTerm, typeFilter, statusFilter]);

  // Unique vehicle types for the filter select
  const uniqueTypes = useMemo(() => {
    const types = vehicles.map((v) => v.type).filter(Boolean);
    return Array.from(new Set(types));
  }, [vehicles]);

  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Search & Actions Strip */}
      <Card className="border-gray-900 bg-gray-950/40 backdrop-blur-md p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Search registration number or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 h-10 text-xs"
              />
              <Search className="absolute left-3 bottom-3 h-4 w-4 text-gray-500" />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 text-xs"
              >
                <option value="">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 text-xs"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </Select>
            </div>
          </div>

          <Button onClick={() => setIsOpen(true)} className="w-full md:w-auto font-bold h-10 px-4.5 text-xs">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            REGISTER VEHICLE
          </Button>
        </div>
      </Card>

      {/* Main Grid table */}
      <Card className="border-gray-900 bg-gray-950/20">
        <CardHeader>
          <CardTitle>Fleet Registry</CardTitle>
          <CardDescription>Master database of transport assets</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredVehicles.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium text-sm">
              No vehicles found matching current search/filter conditions.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>Vehicle Name / Model</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Load Capacity</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Acquisition Cost</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.vehicle_id}>
                    <TableCell className="font-bold text-white tracking-wider">
                      {vehicle.registration_number}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-300">
                      {vehicle.vehicle_name_model}
                    </TableCell>
                    <TableCell>
                      <span className="bg-gray-900 border border-gray-800 text-gray-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                        {vehicle.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-200">
                      {compact.format(vehicle.maximum_load_capacity_kg)} kg
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {compact.format(vehicle.odometer)} km
                    </TableCell>
                    <TableCell className="font-semibold text-gray-300">
                      {currency.format(vehicle.acquisition_cost || 0)}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {vehicle.region || "Global"}
                    </TableCell>
                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rules Notice card matching Mockup */}
      <div className="flex items-start bg-amber-950/10 border border-amber-900/35 rounded-2xl p-4.5 space-x-3 max-w-2xl">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-400 font-medium leading-relaxed">
          <span className="text-amber-500 font-bold block mb-1">Business Enforcement Rules:</span>
          Vehicle registration numbers must be globally unique. Vehicles with status <span className="text-white font-bold">Retired</span> or <span className="text-white font-bold">In Shop</span> will be automatically excluded from the dispatch selection panel to prevent scheduling lockouts.
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register New Fleet Vehicle">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Registration No."
              placeholder="e.g. VAN-05"
              error={errors.registrationNumber}
              {...register("registrationNumber")}
            />
            <Input
              label="Model Name"
              placeholder="e.g. Mercedes Sprinter"
              error={errors.vehicleNameModel}
              {...register("vehicleNameModel")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vehicle Type"
              placeholder="e.g. Van, Truck, Mini"
              error={errors.type}
              {...register("type")}
            />
            <Input
              label="Max Capacity (kg)"
              type="number"
              placeholder="500"
              error={errors.maximumLoadCapacityKg}
              {...register("maximumLoadCapacityKg")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Odometer (km)"
              type="number"
              placeholder="0"
              error={errors.odometer}
              {...register("odometer")}
            />
            <Input
              label="Acquisition Cost (₹)"
              type="number"
              placeholder="12000"
              error={errors.acquisitionCost}
              {...register("acquisitionCost")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Initial Status"
              error={errors.status}
              {...register("status")}
            >
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </Select>

            <Input
              label="Region / Branch"
              placeholder="e.g. West Coast"
              error={errors.region}
              {...register("region")}
            />
          </div>

          <div className="flex space-x-3.5 justify-end pt-4 border-t border-gray-900 mt-6">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="h-10 text-xs">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="h-10 text-xs px-5">
              Save Vehicle Asset
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
