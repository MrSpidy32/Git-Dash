import { useState, useEffect } from 'react';
import type { Account } from '../store';
import { getRunners } from '../github';
import { Server, Tag, Activity } from 'lucide-react';

interface Props {
  account: Account;
}

export function RunnerPanel({ account }: Props) {
  const [runners, setRunners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account.type === 'org') {
      loadRunners();
    } else {
      setRunners([]);
    }
  }, [account]);

  const loadRunners = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRunners(account.login, account.type);
      setRunners(data);
    } catch (e: any) {
      if (e.status === 404) {
        // Normal if they don't have org admin
      } else {
        setError('Could not load runners.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (account.type === 'user') return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-500 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
      <Server className="w-8 h-8 text-slate-700 mb-3" />
      SELF-HOSTED RUNNER TELEMETRY<br/>AVAILABLE FOR ORGANIZATIONS ONLY
    </div>
  );

  if (loading) return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center min-h-[200px]">
      <Activity className="w-6 h-6 text-cyan-500 animate-pulse" />
    </div>
  );
  if (error) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-white flex items-center">
          <Server className="w-5 h-5 mr-2 text-cyan-400" /> Self-Hosted Nodes
        </h2>
      </div>

      {runners.length === 0 ? (
        <p className="text-sm text-slate-500 font-mono tracking-wide">NO NODES DETECTED</p>
      ) : (
        <div className="space-y-3">
          {runners.map(r => (
            <div key={r.id} className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-mono text-sm text-white font-medium">{r.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{r.os}</p>
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-800 px-2 py-1 rounded text-xs font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${r.status === 'online' ? (r.busy ? 'bg-amber-400 shadow-[0_0_5px_#fbbf24]' : 'bg-emerald-400 shadow-[0_0_5px_#34d399]') : 'bg-rose-500 shadow-[0_0_5px_#f43f5e]'}`}></span>
                  <span className="text-slate-300">{r.status === 'online' ? (r.busy ? 'BUSY' : 'IDLE') : 'OFFLINE'}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                {r.labels.map((l: any) => (
                  <span key={l.id} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 flex items-center uppercase tracking-wider font-mono">
                    <Tag className="w-2.5 h-2.5 mr-1 text-cyan-500/70" /> {l.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
