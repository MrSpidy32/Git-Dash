import type { Account } from '../store';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  account?: Account;
  data: any;
  loading: boolean;
  error: string;
}

export function BillingOverview({ data, loading, error }: Props) {
  if (loading) return <div className="p-4 bg-white rounded shadow animate-pulse h-48"></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">{error}</div>;
  if (!data) return null;

  // New Enhanced Billing API format handling
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
        
        // Track self-hosted separately
        if (sku.includes('self-hosted') || sku.includes('self_hosted') || sku.includes('self hosted')) {
          self_hosted_minutes += qty;
        } else {
          total_minutes_used += qty;
          if (item.netAmount > 0) {
            total_paid_minutes_used += qty;
          }

          if (sku.includes('linux') || sku.includes('ubuntu')) minutes_used_breakdown.UBUNTU += qty;
          else if (sku.includes('windows')) minutes_used_breakdown.WINDOWS += qty;
          else if (sku.includes('macos') || sku.includes('mac')) minutes_used_breakdown.MACOS += qty;
        }
      }
    });
  }

  // Since new API doesn't return plan limits, we default to 2000 (Free Tier)
  const included_minutes = 2000;
  const pct = Math.min((total_minutes_used / included_minutes) * 100, 100);
  
  const pieData = [
    { name: 'Ubuntu', value: minutes_used_breakdown?.UBUNTU || 0, color: '#eab308' },
    { name: 'Windows', value: minutes_used_breakdown?.WINDOWS || 0, color: '#3b82f6' },
    { name: 'macOS', value: minutes_used_breakdown?.MACOS || 0, color: '#ec4899' },
  ].filter(d => d.value > 0);

  const isFreeTier = included_minutes === 2000;

  return (
    <div className="bg-white rounded shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Actions Billing Cycle</h2>
        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded">
          {isFreeTier ? 'Free Tier (2000m)' : `Pro/Team Tier (${included_minutes}m)`}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress */}
        <div className="col-span-2">
          <div className="flex justify-between text-sm mb-2">
            <span><strong>{total_minutes_used.toLocaleString()}</strong> GitHub-Hosted mins</span>
            <span className="text-gray-500">{included_minutes.toLocaleString()} mins included</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden flex">
            <div 
              className={`h-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-400' : 'bg-green-500'}`} 
              style={{ width: `${pct}%` }}
            ></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded">
              {self_hosted_minutes.toLocaleString()} Self-Hosted mins (Free)
            </div>
            <div className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 mr-1 text-green-500"/>
              {(included_minutes - total_minutes_used).toLocaleString()} remaining
            </div>
            {total_paid_minutes_used > 0 && (
              <div className="flex items-center text-red-600 font-semibold bg-red-50 px-2 py-1 rounded border border-red-100">
                <AlertTriangle className="w-4 h-4 mr-1"/>
                {total_paid_minutes_used.toLocaleString()} Paid overage mins
              </div>
            )}
          </div>
        </div>

        {/* OS Breakdown Chart */}
        <div className="h-32 relative">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} mins`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400 text-sm">No usage</div>
          )}
          
          <div className="absolute top-0 right-0 text-xs">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center mb-1">
                <span className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: d.color}}></span>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
