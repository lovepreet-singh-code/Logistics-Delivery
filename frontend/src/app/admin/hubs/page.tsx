import { Map } from 'lucide-react';

export default function HubsPage() {
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <Map className="w-8 h-8 text-indigo-400" />
        Hubs & Topology
      </h1>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center shadow-inner">
        <Map className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Module Under Construction</h2>
        <p className="text-slate-500">The interactive topology map and franchise management will be available here soon.</p>
      </div>
    </div>
  );
}
