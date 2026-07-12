import { useOperations } from "../context/OperationsContext.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { getStatusBadge } from "../components/ui/badge.jsx";
import { Download, BarChart4, Route, Fuel, TrendingUp } from "lucide-react";

export default function Analytics() {
  const { analytics, trips, exportCsv, loading } = useOperations();

  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
  const percent = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

  return (
    <div className="space-y-6">
      
      {/* Analytics Action Bar */}
      <Card className="border-gray-900 bg-gray-950/40 backdrop-blur-md p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reports Console</h3>
          <p className="text-xs text-gray-500 font-medium">Download reports or filter analytics datasets</p>
        </div>
        <Button onClick={exportCsv} loading={loading} className="font-bold h-10 px-4.5 text-xs">
          <Download className="mr-2 h-4 w-4 shrink-0" />
          EXPORT CSV DATA SHEET
        </Button>
      </Card>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel: Analytics summary cards */}
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Fleet Asset Efficiency & ROI Summary</CardTitle>
            <CardDescription>Calculated using: ROI = (Revenue - Expenses) / Acquisition Cost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-medium text-sm">
                No analytics logs generated for registered fleet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {analytics.map((row) => {
                  const calculatedRoi = Number(row.roi || 0);
                  const roiPercent = calculatedRoi * 100;
                  
                  return (
                    <div 
                      key={row.vehicle_id} 
                      className="p-5 rounded-xl border border-gray-800 bg-gray-900/40 space-y-4 hover:border-gray-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-white text-sm block tracking-wide">{row.registration_number}</strong>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5 block">
                            {row.type} &bull; {row.region || "Global Scope"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Return on Investment</span>
                          <span className={`text-sm font-extrabold block mt-0.5 ${
                            roiPercent > 0 
                              ? "text-emerald-400" 
                              : roiPercent === 0 
                              ? "text-gray-400" 
                              : "text-red-400"
                          }`}>
                            {roiPercent > 0 ? "+" : ""}{percent.format(roiPercent)}% ROI
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2.5 pt-4 border-t border-gray-900/40 text-[10px] text-gray-500 font-semibold uppercase">
                        <div>
                          <span className="flex items-center text-gray-500 mb-1"><Route className="h-3.5 w-3.5 mr-1" /> Distance</span>
                          <span className="text-gray-200 block text-xs font-bold">{compact.format(row.total_distance_km || 0)} km</span>
                        </div>
                        <div>
                          <span className="flex items-center text-gray-500 mb-1"><Fuel className="h-3.5 w-3.5 mr-1" /> Fuel Liters</span>
                          <span className="text-gray-200 block text-xs font-bold">{compact.format(row.fuel_liters || 0)} L</span>
                        </div>
                        <div>
                          <span className="flex items-center text-gray-500 mb-1"><BarChart4 className="h-3.5 w-3.5 mr-1" /> Efficiency</span>
                          <span className="text-amber-500 block text-xs font-bold">{compact.format(row.fuel_efficiency || 0)} km/L</span>
                        </div>
                        <div>
                          <span className="flex items-center text-gray-500 mb-1"><TrendingUp className="h-3.5 w-3.5 mr-1" /> Oper. Cost</span>
                          <span className="text-red-400 block text-xs font-bold">{currency.format(row.operational_cost || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel: Trip activity trail (Timeline) */}
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Live Dispatch Activity Trail</CardTitle>
            <CardDescription>Chronological sequence of route milestones</CardDescription>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-medium text-sm">
                No active routes on the dispatch timeline.
              </div>
            ) : (
              <div className="relative pl-6 border-l border-gray-900 space-y-6">
                {trips.slice(0, 8).map((trip) => {
                  const statusColors = {
                    Draft: "bg-gray-800 ring-gray-950",
                    Dispatched: "bg-sky-500 ring-sky-950 animate-pulse",
                    Completed: "bg-emerald-500 ring-emerald-950",
                    Cancelled: "bg-red-500 ring-red-950",
                  };
                  const activeClass = statusColors[trip.status] || "bg-gray-800";
                  
                  return (
                    <div key={trip.trip_id} className="relative space-y-1.5">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ${activeClass}`} />
                      
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-xs font-black tracking-wide font-mono">
                          {trip.trip_code}
                        </strong>
                        {getStatusBadge(trip.status)}
                      </div>

                      <div className="text-xs font-medium text-gray-400">
                        <span>{trip.source}</span>
                        <span className="mx-1.5 text-gray-600">&rarr;</span>
                        <span>{trip.destination}</span>
                      </div>

                      <div className="text-[10px] text-gray-600 font-semibold uppercase">
                        Vehicle: <span className="text-gray-500">{trip.registration_number}</span> &bull; Driver: <span className="text-gray-500">{trip.driver_name || "Unassigned"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
