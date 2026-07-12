import { useState, useMemo } from "react";
import { useOperations } from "../context/OperationsContext.jsx";
import { getStatusBadge } from "../components/ui/badge.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table.jsx";
import { Input } from "../components/ui/input.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wrench, ShieldAlert, CheckCircle2, History, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

// Schema for creating maintenance ticket
const maintenanceSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Please select a vehicle"),
  maintenanceType: z.string().trim().min(2, "Maintenance type is required (e.g. Oil Change, Repair)"),
  title: z.string().trim().min(2, "Issue summary / title is required"),
  description: z.string().trim().optional(),
  cost: z.coerce.number().nonnegative("Estimated cost cannot be negative"),
});

export default function Maintenance() {
  const { 
    maintenance, 
    vehicles, 
    createMaintenance, 
    closeMaintenance, 
    loading 
  } = useOperations();

  const [selectedRecordId, setSelectedRecordId] = useState(null);

  // Form for ticket creation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId: "",
      maintenanceType: "Oil Change",
      title: "",
      description: "",
      cost: 0,
    },
  });

  const onSubmit = async (data) => {
    const success = await createMaintenance(data);
    if (success) {
      reset();
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedRecordId) {
      toast.error("Please click on a maintenance ticket in the table first to select it.");
      return;
    }
    const success = await closeMaintenance(selectedRecordId);
    if (success) {
      setSelectedRecordId(null);
    }
  };

  // Vehicles that can go to shop (not retired, and not already in shop)
  const candidateVehicles = useMemo(() => {
    return vehicles.filter(v => v.status !== "Retired");
  }, [vehicles]);

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Create Maintenance Ticket Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Log Maintenance Ticket</CardTitle>
            <CardDescription>Check a vehicle into the workshop for repairs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select
                label="Vehicle to Service"
                error={errors.vehicleId}
                {...register("vehicleId")}
              >
                <option value="">Choose Asset</option>
                {candidateVehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.registration_number} ({v.vehicle_name_model} - Status: {v.status})
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Service Type"
                  placeholder="e.g. Repair, Oil Change"
                  error={errors.maintenanceType}
                  {...register("maintenanceType")}
                />
                <Input
                  label="Estimated Cost ($)"
                  type="number"
                  placeholder="250"
                  error={errors.cost}
                  {...register("cost")}
                />
              </div>

              <Input
                label="Ticket Title"
                placeholder="e.g. Alternator replacement and belt test"
                error={errors.title}
                {...register("title")}
              />

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Service Description
                </label>
                <textarea
                  placeholder="Explain the issues observed and repairs planned..."
                  {...register("description")}
                  className="flex min-h-20 w-full rounded-xl border border-gray-800 bg-gray-900/80 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19]"
                />
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-xl flex items-start space-x-3 text-xs leading-normal">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase tracking-wider">Asset Lockout Rule:</span>
                  Saving this ticket will automatically lock the vehicle's status to <span className="text-white font-bold">In Shop</span>. It will be hidden from the Dispatcher's trip creation selection screen until checked out.
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold h-11 text-xs tracking-wider"
              >
                CHECK INTO WORKSHOP
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Maintenance List Table */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900/60 pb-5">
            <div>
              <CardTitle>Active Workshop Tickets</CardTitle>
              <CardDescription>Track vehicle repairs and complete service tickets</CardDescription>
            </div>
            {selectedRecordId && (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCloseTicket} 
                  loading={loading}
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold h-9"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Close Ticket
                </Button>
                <Button 
                  onClick={() => setSelectedRecordId(null)} 
                  variant="outline" 
                  size="sm" 
                  className="font-bold h-9 text-gray-400"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {maintenance.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-medium text-sm">
                No active or historical maintenance logs recorded.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ticket Title</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.map((record) => {
                    const selected = selectedRecordId === record.maintenance_id;
                    const isOpen = record.status === "Open";
                    
                    return (
                      <TableRow
                        key={record.maintenance_id}
                        onClick={() => isOpen && setSelectedRecordId(record.maintenance_id)}
                        className={`transition-colors ${
                          selected
                            ? "bg-amber-600/10 border-l-4 border-l-amber-500 hover:bg-amber-600/15"
                            : isOpen 
                            ? "cursor-pointer" 
                            : "opacity-60"
                        }`}
                      >
                        <TableCell className="font-bold text-white tracking-wider">
                          {record.registration_number}
                        </TableCell>
                        <TableCell>
                          <span className="bg-gray-900 border border-gray-800 text-gray-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                            {record.maintenance_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-200">
                          {record.title}
                          {record.description && (
                            <div className="text-[10px] text-gray-500 mt-0.5 font-normal truncate max-w-xs">
                              {record.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-300">
                          {currency.format(record.cost || 0)}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
