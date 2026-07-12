import { useState, useMemo, useEffect } from "react";
import { useOperations } from "../context/OperationsContext.jsx";
import { getStatusBadge } from "../components/ui/badge.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Dialog } from "../components/ui/dialog.jsx";
import { Input } from "../components/ui/input.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  MapPin, 
  Scale, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";

// Schema for creating trip
const tripSchema = z.object({
  source: z.string().trim().min(2, "Source location is required"),
  destination: z.string().trim().min(2, "Destination location is required"),
  vehicleId: z.coerce.number().int().positive("Select an available vehicle"),
  driverId: z.coerce.number().int().positive("Select an available driver"),
  cargoWeightKg: z.coerce.number().positive("Cargo weight must be a positive number"),
  plannedDistanceKm: z.coerce.number().positive("Distance must be positive"),
  revenue: z.coerce.number().nonnegative("Revenue cannot be negative"),
  region: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

// Schema for completing trip (Modal Form)
const completionSchema = z.object({
  finalOdometer: z.coerce.number().nonnegative("Final odometer is required"),
  fuelConsumedLiters: z.coerce.number().nonnegative("Fuel consumed is required"),
  actualDistanceKm: z.coerce.number().nonnegative().optional(),
  revenue: z.coerce.number().nonnegative().optional(),
});

export default function Trips() {
  const { 
    trips, 
    vehicles, 
    drivers, 
    createTrip, 
    dispatchTrip, 
    completeTrip, 
    cancelTrip, 
    loading 
  } = useOperations();

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Form setup for creating trip
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      source: "",
      destination: "",
      vehicleId: "",
      driverId: "",
      cargoWeightKg: "",
      plannedDistanceKm: "",
      revenue: 0,
      region: "",
      notes: "",
    },
  });

  // Watch selected vehicle and cargo weight for live capacity checks
  const watchedVehicleId = useWatch({ control, name: "vehicleId" });
  const watchedCargoWeight = useWatch({ control, name: "cargoWeightKg" });

  // Get details of selected vehicle
  const selectedVehicleDetails = useMemo(() => {
    if (!watchedVehicleId) return null;
    return vehicles.find(v => v.vehicle_id === Number(watchedVehicleId));
  }, [watchedVehicleId, vehicles]);

  // Live validation of cargo weight vs vehicle capacity
  const isWeightOverload = useMemo(() => {
    if (!selectedVehicleDetails || !watchedCargoWeight) return false;
    return Number(watchedCargoWeight) > Number(selectedVehicleDetails.maximum_load_capacity_kg);
  }, [selectedVehicleDetails, watchedCargoWeight]);

  const overloadDifference = useMemo(() => {
    if (!isWeightOverload) return 0;
    return Number(watchedCargoWeight) - Number(selectedVehicleDetails.maximum_load_capacity_kg);
  }, [isWeightOverload, selectedVehicleDetails, watchedCargoWeight]);

  // Filter available vehicles and drivers for dispatch
  const availableVehiclesList = useMemo(() => {
    return vehicles.filter(v => v.status === "Available");
  }, [vehicles]);

  const availableDriversList = useMemo(() => {
    return drivers.filter(d => {
      // Driver must be Available, and license must not be expired
      const isExpired = d.license_expiry_date && new Date(d.license_expiry_date) < new Date();
      return d.status === "Available" && !isExpired;
    });
  }, [drivers]);

  // Form setup for completing trip
  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: errorsComplete },
  } = useForm({
    resolver: zodResolver(completionSchema),
  });

  const handleCreateSubmit = async (data) => {
    if (isWeightOverload) {
      toast.error("Dispatch Blocked: Cargo weight exceeds the maximum capacity of the vehicle.");
      return;
    }
    const success = await createTrip(data);
    if (success) {
      reset();
    }
  };

  const handleDispatch = async () => {
    if (!selectedTrip) return;
    const success = await dispatchTrip(selectedTrip.trip_id);
    if (success) setSelectedTrip(null);
  };

  const handleCancel = async () => {
    if (!selectedTrip) return;
    const success = await cancelTrip(selectedTrip.trip_id);
    if (success) setSelectedTrip(null);
  };

  const handleCompleteSubmit = async (data) => {
    if (!selectedTrip) return;
    const success = await completeTrip(selectedTrip.trip_id, data);
    if (success) {
      setIsCompleteModalOpen(false);
      resetComplete();
      setSelectedTrip(null);
    }
  };

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Create Trip Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Create Trip Draft</CardTitle>
            <CardDescription>Digitize dispatch schedule and validate constraints</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Source Depot"
                  placeholder="e.g. Gandhinagar Depot"
                  error={errors.source}
                  {...register("source")}
                />
                <Input
                  label="Destination Hub"
                  placeholder="e.g. Ahmedabad Hub"
                  error={errors.destination}
                  {...register("destination")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Vehicle (Available)"
                  error={errors.vehicleId}
                  {...register("vehicleId")}
                >
                  <option value="">Choose Asset</option>
                  {availableVehiclesList.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.registration_number} ({v.type} - {v.maximum_load_capacity_kg}kg)
                    </option>
                  ))}
                </Select>

                <Select
                  label="Driver (Available)"
                  error={errors.driverId}
                  {...register("driverId")}
                >
                  <option value="">Choose Driver</option>
                  {availableDriversList.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.full_name} (Safety: {d.safety_score})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cargo Weight (kg)"
                  type="number"
                  placeholder="450"
                  error={errors.cargoWeightKg}
                  {...register("cargoWeightKg")}
                />
                <Input
                  label="Planned Distance (km)"
                  type="number"
                  placeholder="35"
                  error={errors.plannedDistanceKm}
                  {...register("plannedDistanceKm")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Estimated Revenue ($)"
                  type="number"
                  placeholder="1500"
                  error={errors.revenue}
                  {...register("revenue")}
                />
                <Input
                  label="Region Scope"
                  placeholder="e.g. West"
                  error={errors.region}
                  {...register("region")}
                />
              </div>

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Dispatcher Notes
                </label>
                <textarea
                  placeholder="Add any specific route instructions..."
                  {...register("notes")}
                  className="flex min-h-20 w-full rounded-xl border border-gray-800 bg-gray-900/80 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19]"
                />
              </div>

              {/* Real-time Overload Warn Card matching Mockup */}
              {selectedVehicleDetails && watchedCargoWeight && (
                <div className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                  isWeightOverload 
                    ? "bg-red-950/20 border-red-500/30 text-red-400" 
                    : "bg-emerald-950/15 border-emerald-500/30 text-emerald-400"
                }`}>
                  <Scale className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-medium space-y-1">
                    <span className="font-bold block uppercase tracking-wider">Weight Distribution Guard:</span>
                    <div>Vehicle Maximum Capacity: <span className="font-bold">{selectedVehicleDetails.maximum_load_capacity_kg} kg</span></div>
                    <div>Requested Cargo Weight: <span className="font-bold">{watchedCargoWeight} kg</span></div>
                    {isWeightOverload ? (
                      <div className="font-bold text-red-500 flex items-center space-x-1 mt-1">
                        <span>X Payload limit exceeded by {overloadDifference} kg &rarr; Dispatch locked.</span>
                      </div>
                    ) : (
                      <div className="font-bold text-emerald-500 flex items-center space-x-1 mt-1">
                        <span>&radic; Weight satisfies vehicle constraints. Dispatch available.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isWeightOverload || loading}
                className="w-full font-bold h-11 text-xs tracking-wider"
              >
                SAVE TRIP DRAFT
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Dispatch Board */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Live Board Grid Card */}
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900/60 pb-5">
            <div>
              <CardTitle>Live Dispatch Board</CardTitle>
              <CardDescription>Monitor status lifecycles and dispatch commands</CardDescription>
            </div>
            {selectedTrip && (
              <div className="flex items-center gap-2">
                {selectedTrip.status === "Draft" && (
                  <Button onClick={handleDispatch} size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-bold h-9">
                    <Play className="h-3.5 w-3.5 mr-1" /> Dispatch
                  </Button>
                )}
                {selectedTrip.status === "Dispatched" && (
                  <Button onClick={() => setIsCompleteModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-500 font-bold h-9">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                  </Button>
                )}
                {["Draft", "Dispatched"].includes(selectedTrip.status) && (
                  <Button onClick={handleCancel} size="sm" variant="destructive" className="font-bold h-9">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                )}
                <Button onClick={() => setSelectedTrip(null)} variant="outline" size="sm" className="font-bold h-9 text-gray-400">
                  Deselect
                </Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-6">
            {trips.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-medium text-sm">
                No trips loaded in current dashboard registers.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {trips.map((trip) => {
                  const active = selectedTrip?.trip_id === trip.trip_id;
                  return (
                    <div
                      key={trip.trip_id}
                      onClick={() => setSelectedTrip(trip)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        active
                          ? "bg-[#111927] border-amber-500 shadow-lg shadow-orange-950/20"
                          : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-sm text-white tracking-wider">
                              {trip.trip_code}
                            </span>
                            <span className="text-gray-600">&bull;</span>
                            <span className="text-[10px] bg-gray-950 text-gray-400 font-bold px-2 py-0.5 rounded border border-gray-800 uppercase">
                              {trip.registration_number || "No Vehicle"}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-xs font-semibold text-gray-300 pt-1.5">
                            <span>{trip.source}</span>
                            <ArrowRight className="h-3.5 w-3.5 mx-2 text-gray-500 shrink-0" />
                            <span>{trip.destination}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1.5">
                          {getStatusBadge(trip.status)}
                          <span className="text-[10px] text-gray-500 font-bold uppercase font-mono">
                            {trip.driver_name || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 pt-4 mt-4 border-t border-gray-900/40 text-[10px] text-gray-500 font-semibold uppercase">
                        <div>
                          Cargo Weight: <span className="text-gray-300 block text-xs font-bold mt-0.5">{trip.cargo_weight_kg} kg</span>
                        </div>
                        <div>
                          Distance: <span className="text-gray-300 block text-xs font-bold mt-0.5">{trip.planned_distance_km} km</span>
                        </div>
                        <div>
                          Est. Revenue: <span className="text-emerald-400 block text-xs font-bold mt-0.5">{currency.format(trip.revenue || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete Trip Dialog Modal */}
      <Dialog 
        isOpen={isCompleteModalOpen} 
        onClose={() => setIsCompleteModalOpen(false)} 
        title={`Complete Trip: ${selectedTrip?.trip_code}`}
      >
        <form onSubmit={handleSubmitComplete(handleCompleteSubmit)} className="space-y-4 pt-2">
          <div className="bg-gray-950/80 border border-gray-900 rounded-xl p-4 flex items-center space-x-3.5 text-xs text-gray-400 leading-normal">
            <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-white block">Closing logs will restore:</span>
              Vehicle <span className="text-white font-bold">{selectedTrip?.registration_number}</span> and Driver <span className="text-white font-bold">{selectedTrip?.driver_name}</span> statuses back to <span className="text-emerald-400 font-bold">Available</span>.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Final Odometer (km)"
              type="number"
              placeholder="e.g. 74500"
              error={errorsComplete.finalOdometer}
              {...registerComplete("finalOdometer")}
            />
            <Input
              label="Fuel Consumed (Liters)"
              type="number"
              placeholder="e.g. 45"
              error={errorsComplete.fuelConsumedLiters}
              {...registerComplete("fuelConsumedLiters")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Actual Distance (km - Optional)"
              type="number"
              placeholder="e.g. 38"
              error={errorsComplete.actualDistanceKm}
              {...registerComplete("actualDistanceKm")}
            />
            <Input
              label="Closing Revenue ($ - Optional)"
              type="number"
              placeholder="e.g. 1550"
              error={errorsComplete.revenue}
              {...registerComplete("revenue")}
            />
          </div>

          <div className="flex space-x-3.5 justify-end pt-4 border-t border-gray-900 mt-6">
            <Button variant="ghost" onClick={() => setIsCompleteModalOpen(false)} className="h-10 text-xs">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="bg-emerald-600 hover:bg-emerald-500 h-10 text-xs px-5">
              Confirm Trip Completion
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
