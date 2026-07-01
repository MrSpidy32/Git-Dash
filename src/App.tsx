import { useState, useEffect } from 'react';
import { AccountManager } from './components/AccountManager';
import { BillingOverview } from './components/BillingOverview';
import { RepoPanel } from './components/RepoPanel';
import { RunnerPanel } from './components/RunnerPanel';
import type { Account } from './store';
import { getBilling } from './github';
import { GitBranch } from 'lucide-react';

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
        setBillingError('GitHub has officially retired the Personal/Org Billing API and moved it to Enterprise only. This data is no longer accessible.');
        return;
      }
      setBillingData(res);
    } catch (err: any) {
      if (err.status === 404 || (err.message && err.message.includes('moved'))) {
        setBillingError('GitHub has officially retired the Personal/Org Billing API and moved it to Enterprise only. This data is no longer accessible.');
      } else {
        setBillingError(err.message || 'Failed to load billing data');
      }
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-6 h-6 text-gray-900" />
            <h1 className="text-xl font-bold tracking-tight">GitDash</h1>
          </div>
          <AccountManager onAccountSelect={setActiveAccount} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!activeAccount ? (
          <div className="text-center py-20">
            <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600">Welcome to GitDash</h2>
            <p className="text-gray-500 mt-2">Please add a GitHub account to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <BillingOverview 
              account={activeAccount} 
              data={billingData} 
              loading={billingLoading} 
              error={billingError} 
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold">Repositories & Workflows</h3>
                <RepoPanel account={activeAccount} billingData={billingData} />
              </div>
              <div className="space-y-6">
                <RunnerPanel account={activeAccount} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
