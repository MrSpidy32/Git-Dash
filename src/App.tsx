import { useState, useEffect } from 'react';
import { AccountManager } from './components/AccountManager';
import { BillingOverview } from './components/BillingOverview';
import { RepoPanel } from './components/RepoPanel';
import { RunnerPanel } from './components/RunnerPanel';
import type { Account } from './store';
import { getBilling } from './github';
import { GitBranch, Activity } from 'lucide-react';

export default function App() {
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');

  useEffect(() => {
    if (activeAccount) {
      loadBilling();
    } else {
      setBillingData(null);
    }
  }, [activeAccount]);

  const loadBilling = async () => {
    setBillingLoading(true);
    setBillingError('');
    try {
      const res = await getBilling(activeAccount!.login, activeAccount!.type);
      if (res.message && res.message.includes('moved')) {
        setBillingError('API retired by GitHub. Enterprise Only.');
        return;
      }
      setBillingData(res);
    } catch (err: any) {
      setBillingError('API retired by GitHub. Enterprise Only.');
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Sleek top navigation */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-default">
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 group-hover:border-cyan-500/50 transition-colors">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white">
              GitDash<span className="text-cyan-500">.</span>
            </h1>
          </div>
          <AccountManager onAccountSelect={setActiveAccount} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!activeAccount ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <div className="w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-center">
                <GitBranch className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-3xl font-light text-white tracking-tight">Telemetry Awaiting Signal</h2>
            <p className="text-slate-500 mt-4 max-w-md text-sm leading-relaxed">
              Connect a GitHub account with a Classic PAT to begin monitoring your Actions pipelines, runners, and billing consumption.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700 ease-out">
            <BillingOverview 
              data={billingData} 
              loading={billingLoading} 
              error={billingError} 
            />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">Repositories & Workflows</h3>
                </div>
                <RepoPanel account={activeAccount} billingData={billingData} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">Infrastructure</h3>
                </div>
                <RunnerPanel account={activeAccount} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
