import { useState } from 'react';
import { AccountManager } from './components/AccountManager';
import { BillingOverview } from './components/BillingOverview';
import { RepoPanel } from './components/RepoPanel';
import { RunnerPanel } from './components/RunnerPanel';
import type { Account } from './store';
import { GitBranch } from 'lucide-react';

export default function App() {
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

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
            <BillingOverview account={activeAccount} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold">Repositories & Workflows</h3>
                <RepoPanel account={activeAccount} />
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
