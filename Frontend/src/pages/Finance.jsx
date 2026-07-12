import { useOperations } from "../context/OperationsContext.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table.jsx";
import { Input } from "../components/ui/input.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Fuel, Receipt, DollarSign, Wallet, FileSpreadsheet } from "lucide-react";

// Schema for fuel log submission
const fuelLogSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Select a vehicle"),
  tripId: z.coerce.number().int().positive("Select associated trip").optional().nullable().or(z.literal("")),
  liters: z.coerce.number().positive("Liters must be a positive number"),
  cost: z.coerce.number().nonnegative("Cost cannot be negative"),
  odometer: z.coerce.number().nonnegative("Odometer reading cannot be negative").optional().nullable().or(z.literal("")),
});

// Schema for expense submission
const expenseSchema = z.object({
  vehicleId: z.coerce.number().int().positive().optional().nullable().or(z.literal("")),
  tripId: z.coerce.number().int().positive().optional().nullable().or(z.literal("")),
  category: z.enum(["Fuel", "Maintenance", "Toll", "Parking", "Misc"]),
  description: z.string().trim().min(2, "Description is required"),
  amount: z.coerce.number().positive("Amount must be a positive value"),
});

export default function Finance() {
  const { 
    vehicles, 
    trips, 
    expenses, 
    createFuelLog, 
    createExpense, 
    loading 
  } = useOperations();

  // Fuel log form setup
  const {
    register: registerFuel,
    handleSubmit: handleSubmitFuel,
    reset: resetFuel,
    formState: { errors: errorsFuel },
  } = useForm({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicleId: "",
      tripId: "",
      liters: "",
      cost: "",
      odometer: "",
    },
  });

  // Expense form setup
  const {
    register: registerExpense,
    handleSubmit: handleSubmitExpense,
    reset: resetExpense,
    formState: { errors: errorsExpense },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicleId: "",
      tripId: "",
      category: "Toll",
      description: "",
      amount: "",
    },
  });

  const onFuelSubmit = async (data) => {
    // Map empty string inputs to null for backend validator
    const payload = {
      ...data,
      tripId: data.tripId ? Number(data.tripId) : null,
      odometer: data.odometer ? Number(data.odometer) : null,
    };
    const success = await createFuelLog(payload);
    if (success) {
      resetFuel();
    }
  };

  const onExpenseSubmit = async (data) => {
    const payload = {
      ...data,
      vehicleId: data.vehicleId ? Number(data.vehicleId) : null,
      tripId: data.tripId ? Number(data.tripId) : null,
    };
    const success = await createExpense(payload);
    if (success) {
      resetExpense();
    }
  };

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  // Calculate quick metrics for financial analysis
  const financeStats = expenses.reduce((acc, curr) => {
    acc.total += Number(curr.amount || 0);
    const category = curr.category || "Misc";
    acc[category] = (acc[category] || 0) + Number(curr.amount || 0);
    return acc;
  }, { total: 0, Fuel: 0, Maintenance: 0, Toll: 0, Parking: 0, Misc: 0 });

  return (
    <div className="space-y-6">
      
      {/* Financial Analytics snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-900/40 border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold text-gray-500 flex items-center justify-between">
            <span>Total Operational Expenses</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <strong className="block text-2xl font-black text-white mt-1.5">{currency.format(financeStats.total)}</strong>
        </Card>
        <Card className="p-4 bg-gray-900/40 border-l-4 border-l-orange-500">
          <div className="text-xs font-semibold text-gray-500 flex items-center justify-between">
            <span>Fuel Refill Costs</span>
            <Fuel className="h-4 w-4" />
          </div>
          <strong className="block text-2xl font-black text-white mt-1.5">{currency.format(financeStats.Fuel)}</strong>
        </Card>
        <Card className="p-4 bg-gray-900/40 border-l-4 border-l-blue-500">
          <div className="text-xs font-semibold text-gray-500 flex items-center justify-between">
            <span>Maintenance Expenses</span>
            <Receipt className="h-4 w-4" />
          </div>
          <strong className="block text-2xl font-black text-white mt-1.5">{currency.format(financeStats.Maintenance)}</strong>
        </Card>
        <Card className="p-4 bg-gray-900/40 border-l-4 border-l-purple-500">
          <div className="text-xs font-semibold text-gray-500 flex items-center justify-between">
            <span>Tolls & Parking Fees</span>
            <Wallet className="h-4 w-4" />
          </div>
          <strong className="block text-2xl font-black text-white mt-1.5">
            {currency.format((financeStats.Toll || 0) + (financeStats.Parking || 0))}
          </strong>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel fill log form */}
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Log Fuel Fill</CardTitle>
            <CardDescription>Record fuel quantity, costs and odometer reading</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitFuel(onFuelSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Vehicle"
                  error={errorsFuel.vehicleId}
                  {...registerFuel("vehicleId")}
                >
                  <option value="">Choose Asset</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number}</option>
                  ))}
                </Select>

                <Select
                  label="Associated Trip (Optional)"
                  error={errorsFuel.tripId}
                  {...registerFuel("tripId")}
                >
                  <option value="">No Associated Trip</option>
                  {trips.map(t => (
                    <option key={t.trip_id} value={t.trip_id}>{t.trip_code}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Liters Refilled"
                  type="number"
                  placeholder="e.g. 50"
                  error={errorsFuel.liters}
                  {...registerFuel("liters")}
                />
                <Input
                  label="Total Cost ($)"
                  type="number"
                  placeholder="e.g. 75"
                  error={errorsFuel.cost}
                  {...registerFuel("cost")}
                />
                <Input
                  label="Odometer (km - Opt)"
                  type="number"
                  placeholder="e.g. 74000"
                  error={errorsFuel.odometer}
                  {...registerFuel("odometer")}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold h-11 text-xs tracking-wider"
              >
                SAVE FUEL TRANSACTION
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expense log form */}
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Log General Expense</CardTitle>
            <CardDescription>Record tolls, parking fines, and miscellaneous costs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitExpense(onExpenseSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Vehicle (Optional)"
                  error={errorsExpense.vehicleId}
                  {...registerExpense("vehicleId")}
                >
                  <option value="">None</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number}</option>
                  ))}
                </Select>

                <Select
                  label="Trip (Optional)"
                  error={errorsExpense.tripId}
                  {...registerExpense("tripId")}
                >
                  <option value="">None</option>
                  {trips.map(t => (
                    <option key={t.trip_id} value={t.trip_id}>{t.trip_code}</option>
                  ))}
                </Select>

                <Select
                  label="Category"
                  error={errorsExpense.category}
                  {...registerExpense("category")}
                >
                  <option value="Toll">Toll</option>
                  <option value="Parking">Parking</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Misc">Misc</option>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2">
                  <Input
                    label="Description"
                    placeholder="e.g. Highway Toll tax fee"
                    error={errorsExpense.description}
                    {...registerExpense("description")}
                  />
                </div>
                <Input
                  label="Amount ($)"
                  type="number"
                  placeholder="e.g. 15"
                  error={errorsExpense.amount}
                  {...registerExpense("amount")}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold h-11 text-xs tracking-wider animate-shimmer"
              >
                RECORD EXPENSE RECEIPT
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="border-gray-900 bg-gray-950/20">
        <CardHeader>
          <CardTitle>Operating Expenses Ledger</CardTitle>
          <CardDescription>A comprehensive trail of operational costs</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-medium text-sm">
              No expenses recorded in the general ledger.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Asset Reference</TableHead>
                  <TableHead>Date Logged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.expense_id}>
                    <TableCell>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                        expense.category === "Fuel" 
                          ? "bg-orange-500/10 border-orange-500/20 text-orange-400" 
                          : expense.category === "Maintenance"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-gray-900 border-gray-800 text-gray-400"
                      }`}>
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-200">
                      {expense.description || "N/A"}
                    </TableCell>
                    <TableCell className="font-bold text-white tracking-wide">
                      {currency.format(expense.amount || 0)}
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono text-xs">
                      {expense.trip_code 
                        ? `Trip: ${expense.trip_code}` 
                        : expense.registration_number 
                        ? `Vehicle: ${expense.registration_number}` 
                        : "General"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {expense.occurred_at ? new Date(expense.occurred_at).toLocaleString() : "Just Now"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
