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
import { Search, Plus, ShieldAlert, Bell, CalendarClock, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

// Schema matching backend driver creation structure
const driverSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  licenseNumber: z.string().trim().min(3, "License number is required"),
  licenseCategory: z.string().trim().min(1, "License category is required"),
  licenseExpiryDate: z.string().min(1, "Expiry date is required"),
  contactNumber: z.string().trim().min(5, "Contact number is required"),
  safetyScore: z.coerce.number().min(0).max(100, "Safety score is between 0 and 100"),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]),
  region: z.string().trim().optional(),
});

export default function Drivers() {
  const { 
    drivers, 
    createDriver, 
    updateDriverStatus, 
    sendLicenseReminders, 
    loading 
  } = useOperations();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [sendingAlerts, setSendingAlerts] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      fullName: "",
      licenseNumber: "",
      licenseCategory: "Heavy Commercial",
      licenseExpiryDate: "",
      contactNumber: "",
      safetyScore: 100,
      status: "Available",
      region: "",
    },
  });

  const onSubmit = async (data) => {
    const success = await createDriver(data);
    if (success) {
      setIsOpen(false);
      reset();
    }
  };

  const handleReminderScan = async () => {
    setSendingAlerts(true);
    await sendLicenseReminders(30);
    setSendingAlerts(false);
  };

  const handleQuickStatusChange = async (status) => {
    if (!selectedDriverId) {
      toast.error("Please click on a driver in the table below first to select them.");
      return;
    }
    const success = await updateDriverStatus(selectedDriverId, status);
    if (success) {
      setSelectedDriverId(null); // Clear selection on success
    }
  };

  // Perform client-side filter and search
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchSearch =
        d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [drivers, searchTerm]);

  // Expiry check logic (License validity)
  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isSelected = (driverId) => {
    return selectedDriverId === driverId;
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Commands Card */}
      <Card className="border-gray-900 bg-gray-950/40 backdrop-blur-md p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80 relative">
            <Input
              placeholder="Search driver name or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 h-10 text-xs"
            />
            <Search className="absolute left-3 bottom-3 h-4 w-4 text-gray-500" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleReminderScan}
              loading={sendingAlerts}
              variant="outline"
              className="w-full sm:w-auto h-10 text-xs text-gray-300 font-semibold"
            >
              <Bell className="mr-2 h-4 w-4 text-amber-500 shrink-0" />
              SCAN & SEND REMINDERS
            </Button>
            
            <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto font-bold h-10 px-4.5 text-xs">
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              ADD DRIVER
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="border-gray-900 bg-gray-950/20">
        <CardHeader>
          <CardTitle>Driver Profiles & Safety Indices</CardTitle>
          <CardDescription>
            Click any row to select a driver and manage status quickly using the toggle board below.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDrivers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium text-sm">
              No driver profiles registered in the system.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Contact No.</TableHead>
                  <TableHead>Safety Score</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => {
                  const expired = isLicenseExpired(driver.license_expiry_date);
                  const selected = isSelected(driver.driver_id);
                  
                  return (
                    <TableRow 
                      key={driver.driver_id} 
                      onClick={() => setSelectedDriverId(driver.driver_id)}
                      className={`cursor-pointer transition-colors ${
                        selected 
                          ? "bg-amber-600/10 border-l-4 border-l-amber-500 hover:bg-amber-600/15" 
                          : ""
                      }`}
                    >
                      <TableCell className="font-bold text-white tracking-wider flex items-center space-x-2">
                        <span>{driver.full_name}</span>
                        {selected && <UserCheck className="h-4 w-4 text-amber-500" />}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{driver.license_number}</TableCell>
                      <TableCell className="text-gray-300 font-medium">{driver.license_category}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-mono text-xs ${expired ? "text-red-500 font-semibold" : ""}`}>
                            {driver.license_expiry_date?.slice(0, 10)}
                          </span>
                          {expired && (
                            <span className="bg-red-500/10 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/25 uppercase tracking-wide">
                              Expired
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">{driver.contact_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-900 rounded-full h-1.5 overflow-hidden border border-gray-800">
                            <div 
                              className={`h-1.5 rounded-full ${
                                driver.safety_score >= 80 
                                  ? "bg-emerald-500" 
                                  : driver.safety_score >= 50 
                                  ? "bg-amber-500" 
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${driver.safety_score || 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{driver.safety_score || 100}/100</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">{driver.region || "Global"}</TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Toggle Status Block matching Mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        {/* Toggle Panel */}
        <Card className="border-gray-900 bg-gray-950/40 backdrop-blur-md p-5 space-y-4">
          <div className="flex flex-col">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Quick Driver Status Board
            </h4>
            <span className="text-[11px] text-gray-500 mt-1">
              Select a driver profile in the table above and toggle their live status below.
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1.5">
            <button
              onClick={() => handleQuickStatusChange("Available")}
              disabled={!selectedDriverId || loading}
              className="px-4 py-2 text-xs font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              Available
            </button>
            <button
              onClick={() => handleQuickStatusChange("On Trip")}
              disabled={!selectedDriverId || loading}
              className="px-4 py-2 text-xs font-bold bg-sky-500/10 border border-sky-500/25 text-sky-400 rounded-xl hover:bg-sky-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              On Trip
            </button>
            <button
              onClick={() => handleQuickStatusChange("Off Duty")}
              disabled={!selectedDriverId || loading}
              className="px-4 py-2 text-xs font-bold bg-gray-800 border border-gray-700/60 text-gray-400 rounded-xl hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              Off Duty
            </button>
            <button
              onClick={() => handleQuickStatusChange("Suspended")}
              disabled={!selectedDriverId || loading}
              className="px-4 py-2 text-xs font-bold bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-xl hover:bg-orange-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              Suspended
            </button>
          </div>
        </Card>

        {/* Business Rule */}
        <div className="flex items-start bg-amber-950/10 border border-amber-900/35 rounded-2xl p-4.5 space-x-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400 font-medium leading-relaxed">
            <span className="text-amber-500 font-bold block mb-1">Safety Enforcement Rules:</span>
            Drivers with an <span className="text-white font-bold">Expired Driving License</span> or status set to <span className="text-white font-bold">Suspended</span> will be locked out and cannot be assigned to any dispatch trips.
          </div>
        </div>
      </div>

      {/* Register Driver Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register Safety Driver">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Mercer"
              error={errors.fullName}
              {...register("fullName")}
            />
            <Input
              label="License Number"
              placeholder="e.g. DL-88213"
              error={errors.licenseNumber}
              {...register("licenseNumber")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="License Category"
              placeholder="e.g. HMV, LMV, Forklift"
              error={errors.licenseCategory}
              {...register("licenseCategory")}
            />
            <Input
              label="Expiry Date"
              type="date"
              error={errors.licenseExpiryDate}
              {...register("licenseExpiryDate")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Number"
              placeholder="e.g. +91 98765 43210"
              error={errors.contactNumber}
              {...register("contactNumber")}
            />
            <Input
              label="Safety Index Score"
              type="number"
              placeholder="100"
              error={errors.safetyScore}
              {...register("safetyScore")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Active Status"
              error={errors.status}
              {...register("status")}
            >
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </Select>

            <Input
              label="Region / Depot"
              placeholder="e.g. Gandhinagar Depot"
              error={errors.region}
              {...register("region")}
            />
          </div>

          <div className="flex space-x-3.5 justify-end pt-4 border-t border-gray-900 mt-6">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="h-10 text-xs">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="h-10 text-xs px-5">
              Register Driver
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
