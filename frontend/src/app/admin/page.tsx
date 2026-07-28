import { Truck, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import AdminChart from './AdminChart';

// Force dynamic rendering to ensure fresh data every hit
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let activeFleet = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;
  let error = false;

  try {
    // Parallel fetching for performance
    const [fleetRes, ordersRes] = await Promise.all([
      fetch('http://localhost:8080/api/fleet/stats', { cache: 'no-store' }),
      fetch('http://localhost:8080/api/orders/stats', { cache: 'no-store' })
    ]);

    const fleetData = await fleetRes.json();
    activeFleet = fleetData.count || 0;

    const ordersData = await ordersRes.json();
    pendingOrders = ordersData.pending || 0;
    deliveredOrders = ordersData.delivered || 0;
  } catch (err) {
    console.error("Failed to fetch live data. Falling back to 0.", err);
    error = true;
  }

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Operations Command
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Real-time logistics platform overview</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm font-medium backdrop-blur-md">
              <AlertTriangle className="w-4 h-4" />
              <span>Live connection failed.</span>
            </div>
          )}
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl group transition-all hover:bg-slate-800">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Active Fleet</p>
                <h3 className="text-4xl font-bold text-white">{activeFleet}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
                <Truck className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl group transition-all hover:bg-slate-800">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Pending Orders</p>
                <h3 className="text-4xl font-bold text-white">{pendingOrders}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl group transition-all hover:bg-slate-800">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Delivered</p>
                <h3 className="text-4xl font-bold text-white">{deliveredOrders}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-bold text-slate-200 mb-6 relative z-10">Delivery Performance</h2>
          <AdminChart />
        </div>

      </div>
    </div>
  );
}
