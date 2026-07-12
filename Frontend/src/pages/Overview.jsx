import { useState } from "react";
import { useOperations } from "../context/OperationsContext.jsx";
import { getStatusBadge } from "../components/ui/badge.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table.jsx";
import { Input } from "../components/ui/input.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { 
  TrendingUp, 
  MapPin, 
  Layers, 
  Clock, 
  Truck, 
  Users, 
  Wrench, 
  Milestone 
} from "lucide-react";

export default function Overview() {
  const { 
    dashboard, 
    vehicles, 
    trips, 
    filters, 
    applyFilters, 
    loading 
  } = useOperations();

  const [localFilters, setLocalFilters] = useState({
    vehicleType: filters.vehicleType || "",
    vehicleStatus: filters.vehicleStatus || "",
    region: filters.region || "",
  });

  const handleApply = (e) => {
    e.preventDefault();
    applyFilters(localFilters);
  };

  // Helper formatting values
  const compact = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  // Calculate status statistics from active vehicles list
  const vehicleStats = vehicles.reduce(
    (acc, curr) => {
      const status = curr.status || "Available";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { Available: 0, "On Trip": 0, "In Shop": 0, Retired: 0 }
  );

  const totalVehiclesCount = vehicles.length || 1;

  const getPercentage = (count) => {
    return (count / totalVehiclesCount) * 100;
  };

  const metricCards = [
    {
      label: "Active Vehicles",
      value: dashboard?.active_vehicles ?? 0,
      icon: Truck,
      color: "border-l-4 border-l-blue-500",
    },
    {
      label: "Available Vehicles",
      value: dashboard?.available_vehicles ?? 0,
      icon: TrendingUp,
      color: "border-l-4 border-l-emerald-500",
    },
    {
      label: "Vehicles In Shop",
      value: dashboard?.vehicles_in_maintenance ?? 0,
      icon: Wrench,
      color: "border-l-4 border-l-orange-500",
    },
    {
      label: "Active Trips",
      value: dashboard?.active_trips ?? 0,
      icon: Milestone,
      color: "border-l-4 border-l-sky-500",
    },
    {
      label: "Pending Trips",
      value: dashboard?.pending_trips ?? 0,
      icon: Clock,
      color: "border-l-4 border-l-purple-500",
    },
    {
      label: "Drivers On Duty",
      value: dashboard?.drivers_on_duty ?? 0,
      icon: Users,
      color: "border-l-4 border-l-indigo-500",
    },
    {
      label: "Fleet Utilization",
      value: `${compact.format(dashboard?.fleet_utilization_pct || 0)}%`,
      icon: Layers,
      color: "border-l-4 border-l-teal-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters heading card */}
      <Card className="border-gray-900 bg-gray-950/40 backdrop-blur-md">
        <form onSubmit={handleApply} className="p-5 flex flex-col md:flex-row items-end gap-4 justify-between">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Vehicle Type"
              placeholder="e.g. Truck, Van"
              value={localFilters.vehicleType}
              onChange={(e) => setLocalFilters({ ...localFilters, vehicleType: e.target.value })}
            />
            <Select
              label="Vehicle Status"
              value={localFilters.vehicleStatus}
              onChange={(e) => setLocalFilters({ ...localFilters, vehicleStatus: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </Select>
            <Input
              label="Region"
              placeholder="e.g. West, North"
              value={localFilters.region}
              onChange={(e) => setLocalFilters({ ...localFilters, region: e.target.value })}
            />
          </div>
          <Button type="submit" loading={loading} className="w-full md:w-32 h-11 shrink-0 font-bold">
            Apply Filters
          </Button>
        </form>
      </Card>

      {/* Metric Tiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className={`p-4 bg-gray-900/50 hover:bg-gray-900/80 transition-all duration-200 ${card.color}`}>
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-[10px] uppercase font-bold tracking-wider truncate mr-1">
                  {card.label}
                </span>
                <Icon className="h-4 w-4 shrink-0 text-gray-600" />
              </div>
              <strong className="block text-xl font-black text-white mt-2">
                {card.value}
              </strong>
            </Card>
          );
        })}
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips Table Panel */}
        <Card className="lg:col-span-2 border-gray-900/80 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Recent Trip Registry</CardTitle>
            <CardDescription>Live tracking logs from operations dispatcher</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {trips.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium text-sm">
                No active or drafted trips found. Go to Trips to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Code</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.slice(0, 6).map((trip) => (
                    <TableRow key={trip.trip_id}>
                      <TableCell className="font-bold text-white tracking-wider">{trip.trip_code}</TableCell>
                      <TableCell className="font-medium">{trip.registration_number}</TableCell>
                      <TableCell className="text-gray-400">{trip.driver_name || "Unassigned"}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="text-gray-500">{trip.source}</span>
                          <span className="mx-1 text-gray-600">&rarr;</span>
                          <span className="text-gray-300 font-medium">{trip.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Status Distribution Bars */}
        <Card className="border-gray-900/80 bg-gray-950/20 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Vehicle Status Profile</CardTitle>
            <CardDescription>Visual fleet utilization statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
            {/* Available Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-gray-300">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />Available</span>
                <span className="text-white">{vehicleStats.Available} ({compact.format(getPercentage(vehicleStats.Available))}%)</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-800">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(vehicleStats.Available)}%` }}
                />
              </div>
            </div>

            {/* On Trip Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-gray-300">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-sky-500 mr-2" />On Trip</span>
                <span className="text-white">{vehicleStats["On Trip"]} ({compact.format(getPercentage(vehicleStats["On Trip"]))}%)</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-800">
                <div 
                  className="bg-sky-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(vehicleStats["On Trip"])}%` }}
                />
              </div>
            </div>

            {/* In Shop Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-gray-300">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-orange-500 mr-2" />In Shop (Maintenance)</span>
                <span className="text-white">{vehicleStats["In Shop"]} ({compact.format(getPercentage(vehicleStats["In Shop"]))}%)</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-800">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(vehicleStats["In Shop"])}%` }}
                />
              </div>
            </div>

            {/* Retired Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-gray-300">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-red-500 mr-2" />Retired</span>
                <span className="text-white">{vehicleStats.Retired} ({compact.format(getPercentage(vehicleStats.Retired))}%)</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-800">
                <div 
                  className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(vehicleStats.Retired)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
