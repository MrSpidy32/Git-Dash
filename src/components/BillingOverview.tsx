import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, CircleDashed } from 'lucide-react';

interface Props {
  data: any;
  loading: boolean;
  error: string;
}

export function BillingOverview({ data, loading, error }: Props) {
  if (loading) return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center h-48">
      <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
    </div>
  );
  if (error) return (
    <div className="p-6 bg-slate-900/50 border border-rose-500/30 text-rose-400 rounded-2xl text-sm">
      {error}
    </div>
  );
  if (!data) return null;

  let total_minutes_used = 0;
  let total_paid_minutes_used = 0;
  let self_hosted_minutes = 0;
  const minutes_used_breakdown = { UBUNTU: 0, WINDOWS: 0, MACOS: 0 };

  if (data.usageItems) {
    data.usageItems.forEach((item: any) => {
      const isActions = item.product === 'Actions' || (item.sku && item.sku.toLowerCase().includes('actions'));
      const qty = item.netQuantity || item.grossQuantity || 0;
      
      if (isActions) {
        const sku = item.sku.toLowerCase();
        
        if (sku.includes('self-hosted') || sku.includes('self_hosted') || sku.includes('self hosted')) {
          self_hosted_minutes += qty;
        } else {
          total_minutes_used += qty;
          if (item.netAmount > 0) total_paid_minutes_used += qty;

          if (sku.includes('linux') || sku.includes('ubuntu')) minutes_used_breakdown.UBUNTU += qty;
          else if (sku.includes('windows')) minutes_used_breakdown.WINDOWS += qty;
          else if (sku.includes('macos') || sku.includes('mac')) minutes_used_breakdown.MACOS += qty;
        }
      }
    });
  }

  const included_minutes = 2000;
  const pct = Math.min((total_minutes_used / included_minutes) * 100, 100);
  
  const pieData = [
    { name: 'Ubuntu', value: minutes_used_breakdown.UBUNTU, color: '#0ea5e9' }, // sky-500
    { name: 'Windows', value: minutes_used_breakdown.WINDOWS, color: '#8b5cf6' }, // violet-500
    { name: 'macOS', value: minutes_used_breakdown.MACOS, color: '#f43f5e' }, // rose-500
  ].filter(d => d.value > 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-lg font-medium text-white flex items-center">
          <CircleDashed className="w-5 h-5 mr-2 text-cyan-400" />
          Consumption Telemetry
        </h2>
        <span className="text-xs font-mono px-3 py-1 bg-slate-950 border border-slate-800 text-cyan-400 rounded-full">
          Standard Quota
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Progress Track */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-3 font-mono">
            <div className="flex flex-col">
              <span className="text-3xl font-light text-white">{total_minutes_used.toLocaleString()}</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Hosted Mins</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-sm">{included_minutes.toLocaleString()}</span>
              <span className="text-xs text-slate-600 ml-1">LIMIT</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/50">
            <div 
              className={`h-full relative ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-400' : 'bg-cyan-400'}`} 
              style={{ width: `${pct}%`, boxShadow: '0 0 10px currentColor' }}
            ></div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center text-emerald-400 text-xs font-mono bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              {self_hosted_minutes.toLocaleString()} SELF-HOSTED MINS
            </div>
            <div className="flex items-center text-slate-400 text-xs font-mono bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
              {(included_minutes - total_minutes_used).toLocaleString()} REMAINING
            </div>
            {total_paid_minutes_used > 0 && (
              <div className="flex items-center text-rose-400 text-xs font-mono bg-rose-400/10 px-3 py-1.5 rounded-full border border-rose-400/20">
                {total_paid_minutes_used.toLocaleString()} OVERAGE MINS
              </div>
            )}
          </div>
        </div>

        {/* OS Breakdown Chart */}
        <div className="h-40 relative flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" stroke="none" paddingAngle={5}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => `${value} mins`} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="text-slate-600 text-xs font-mono tracking-widest uppercase">No OS Data</div>
          )}
          
          <div className="absolute top-0 right-0 flex flex-col space-y-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center text-xs font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full mr-2 shadow-sm" style={{backgroundColor: d.color, boxShadow: `0 0 5px ${d.color}`}}></span>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
