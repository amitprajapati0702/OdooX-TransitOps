import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../context/AuthContext.jsx";
import { Input } from "../components/ui/input.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card } from "../components/ui/card.jsx";
import { useState } from "react";
import { Shield, KeyRound, Mail } from "lucide-react";

// Validate inputs before submitting to the backend
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(["Admin", "Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"], {
    errorMap: () => ({ message: "Please select an access role" }),
  }),
});

export default function Login() {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@gmail.com",
      password: "Password@123",
      role: "Admin",
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    await login(data.email, data.password, data.role);
    setSubmitting(false);
  };

  const autofillDemo = (email, password, role) => {
    setValue("email", email);
    setValue("password", password);
    setValue("role", role);
  };

  return (
    <div className="min-h-screen bg-[#080d16] text-[#eef3ff] flex flex-col md:flex-row">
      {/* Left Branding Panel */}
      <section className="hidden md:flex md:w-7/12 bg-gradient-to-br from-[#0b1424] via-[#080f1b] to-[#040810] p-16 flex-col justify-between border-r border-gray-900 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

        <div className="flex items-center space-x-3.5 z-10">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-[#0b0f19] text-xl shadow-lg shadow-orange-950/25">
            T
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white leading-tight tracking-wider uppercase">TransitOps</h1>
            <span className="text-[10px] tracking-widest text-amber-500 font-extrabold uppercase">Platform</span>
          </div>
        </div>

        <div className="max-w-xl z-10">
          <span className="text-amber-500 font-bold text-xs uppercase tracking-widest bg-amber-950/45 px-3.5 py-1.5 rounded-full border border-amber-500/15">
            LOGISTICS HACKATHON
          </span>
          <h2 className="text-4xl font-extrabold text-white mt-6 leading-tight tracking-tight">
            Enterprise transport operations, built for dispatch and control.
          </h2>
          <p className="text-gray-400 mt-4 text-base leading-relaxed">
            A responsive console for fleet managers, dispatch controllers, safety officers, and financial analysts. Track vehicles, manage maintenance, and calculate live ROI metrics in one workspace.
          </p>

          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-900">
            <div>
              <strong className="block text-2xl font-extrabold text-white">100%</strong>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1 block">Live Rules</span>
            </div>
            <div>
              <strong className="block text-2xl font-extrabold text-white">RBAC</strong>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1 block">Scoped Views</span>
            </div>
            <div>
              <strong className="block text-2xl font-extrabold text-white">CSV</strong>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1 block">Data Export</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-600 font-medium z-10">
          TransitOps Panel &copy; 2026. Made with passion.
        </div>
      </section>

      {/* Right Login Card Panel */}
      <main className="w-full md:w-5/12 flex items-center justify-center p-8 bg-[#070b13] relative">
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md flex flex-col space-y-8 z-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <Input
                label="Email Address"
                placeholder="Raven.k@transitops.in"
                error={errors.email}
                {...register("email")}
                className="pl-10"
              />
              <Mail className="absolute left-3.5 bottom-3.5 h-4.5 w-4.5 text-gray-500" />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password}
                {...register("password")}
                className="pl-10"
              />
              <KeyRound className="absolute left-3.5 bottom-3.5 h-4.5 w-4.5 text-gray-500" />
            </div>

            <div className="relative">
              <Select
                label="Role (RBAC)"
                error={errors.role}
                {...register("role")}
                className="pl-10"
              >
                <option value="Admin" className="bg-gray-950 text-gray-300">Admin</option>
                <option value="Fleet Manager" className="bg-gray-950 text-gray-300">Fleet Manager</option>
                <option value="Dispatcher" className="bg-gray-950 text-gray-300">Dispatcher</option>
                <option value="Safety Officer" className="bg-gray-950 text-gray-300">Safety Officer</option>
                <option value="Financial Analyst" className="bg-gray-950 text-gray-300">Financial Analyst</option>
              </Select>
              <Shield className="absolute left-3.5 bottom-3.5 h-4.5 w-4.5 text-gray-500" />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-sm py-1.5">
              <label className="flex items-center space-x-2.5 text-gray-400 font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-800 bg-gray-900 text-amber-500 focus:ring-0 focus:ring-offset-0 h-4.5 w-4.5 cursor-pointer" 
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-xs font-semibold text-amber-500 hover:text-amber-400">
                Forgot password?
              </a>
            </div>

            <Button 
              type="submit" 
              loading={submitting} 
              className="w-full mt-4 h-12 text-sm font-bold tracking-widest"
            >
              SIGN IN
            </Button>
          </form>

          {/* Scopes description block matching mockup */}
          <div className="border-t border-gray-900/80 pt-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Access is scoped by role after login:
            </h4>
            <ul className="space-y-2 text-xs text-gray-400 font-medium list-disc list-inside">
              <li><span className="text-white font-bold">Fleet Manager</span> &rarr; Fleet Registry, Maintenance</li>
              <li><span className="text-white font-bold">Dispatcher</span> &rarr; Dashboard KPIs, Trip Operations</li>
              <li><span className="text-white font-bold">Safety Officer</span> &rarr; Drivers, Compliance, Reminders</li>
              <li><span className="text-white font-bold">Financial Analyst</span> &rarr; Fuel logs & Expenses, Analytics</li>
            </ul>
          </div>

          {/* Quick Demo Autofills */}
          <div className="bg-gray-950/80 border border-gray-900 rounded-xl p-4.5">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">Demo Accounts Autofill:</h4>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => autofillDemo("admin@gmail.com", "Password@123", "Admin")}
                className="text-[10px] bg-gray-900 text-gray-300 px-2.5 py-1.5 rounded-lg border border-gray-850 hover:bg-amber-500/10 hover:text-amber-400 transition cursor-pointer"
              >
                Load Seeded Admin Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
