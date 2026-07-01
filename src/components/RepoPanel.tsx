import { useState, useEffect } from 'react';
import type { Account } from '../store';
import { getRepos, getWorkflows, toggleWorkflow, getWorkflowRuns } from '../github';
import { CheckCircle2, XCircle, Clock, Power, ChevronRight, FolderGit2 } from 'lucide-react';

interface Props {
  account: Account;
  billingData?: any;
}

export function RepoPanel({ account, billingData }: Props) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  useEffect(() => {
    loadRepos();
  }, [account]);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const data = await getRepos(account.login, account.type);
      setRepos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRepoMinutes = (repoFullName: string) => {
    if (!billingData || !billingData.usageItems) return { hosted: 0, self: 0 };
    
    return billingData.usageItems.reduce((acc: any, item: any) => {
      if ((item.product === 'Actions' || (item.sku && item.sku.toLowerCase().includes('actions'))) && 
          item.repositoryName && 
          item.repositoryName.toLowerCase() === repoFullName.toLowerCase()) {
        const qty = item.netQuantity || item.grossQuantity || 0;
        const sku = item.sku.toLowerCase();
        
        if (sku.includes('self-hosted') || sku.includes('self_hosted') || sku.includes('self hosted')) {
          acc.self += qty;
        } else {
          acc.hosted += qty;
        }
      }
      return acc;
    }, { hosted: 0, self: 0 });
  };

  if (loading) return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 font-mono text-sm animate-pulse">
      SYNCING REPOSITORIES...
    </div>
  );

  return (
    <div className="space-y-4">
      {repos.map(repo => {
        const minutes = getRepoMinutes(repo.full_name);
        const isExpanded = expandedRepo === repo.name;
        
        return (
          <div key={repo.id} className={`bg-slate-900 border transition-all duration-200 rounded-2xl overflow-hidden ${isExpanded ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}>
            <div 
              className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              onClick={() => setExpandedRepo(isExpanded ? null : repo.name)}
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 shrink-0">
                  <FolderGit2 className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white text-base leading-none">{repo.name}</h4>
                  <div className="flex items-center mt-2 gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-mono border ${repo.private ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 mt-2 sm:mt-0">
                <div className="flex flex-col text-right font-mono mr-4">
                  <span className="text-sm text-white">{minutes.hosted > 0 ? `${minutes.hosted.toLocaleString()}m` : repo.private ? '0m' : 'Free'}</span>
                  {minutes.self > 0 && <span className="text-[10px] text-emerald-400 tracking-wider">+{minutes.self.toLocaleString()}m SELF</span>}
                </div>
                <div className={`p-1.5 rounded-full bg-slate-800 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-cyan-500/20 text-cyan-400' : ''}`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            {isExpanded && (
              <div className="border-t border-slate-800 bg-slate-950/50">
                <RepoDetails owner={account.login} repo={repo.name} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RepoDetails({ owner, repo }: { owner: string, repo: string }) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getWorkflows(owner, repo).catch(() => []),
      getWorkflowRuns(owner, repo).catch(() => [])
    ]).then(([wfs, rns]) => {
      setWorkflows(wfs);
      setRuns(rns);
      setLoading(false);
    });
  }, [owner, repo]);

  const handleToggle = async (wf: any) => {
    const isEnabling = wf.state !== 'active';
    try {
      await toggleWorkflow(owner, repo, wf.id, isEnabling);
      setWorkflows(workflows.map(w => w.id === wf.id ? { ...w, state: isEnabling ? 'active' : 'disabled_manually' } : w));
    } catch (e) {
      alert('Failed to toggle workflow');
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500 font-mono tracking-widest animate-pulse">FETCHING PIPELINES...</div>;

  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Workflows List */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-3">Pipelines</h4>
        {workflows.length === 0 ? <p className="text-xs text-slate-600 font-mono">No pipelines configured.</p> : (
          <ul className="space-y-2">
            {workflows.map(wf => (
              <li key={wf.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl text-sm">
                <span className={`font-medium ${wf.state !== 'active' ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-200'}`}>{wf.name}</span>
                <button 
                  onClick={() => handleToggle(wf)}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${wf.state === 'active' ? 'bg-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'}`}
                >
                  <Power className="w-3 h-3 mr-1.5"/>
                  {wf.state === 'active' ? 'HALT' : 'ACTIVATE'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Runs */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-3">Recent Execution Logs</h4>
        {runs.length === 0 ? <p className="text-xs text-slate-600 font-mono">No execution logs found.</p> : (
          <ul className="space-y-2">
            {runs.slice(0, 5).map(run => (
              <li key={run.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl text-sm">
                <div className="flex items-center truncate pr-3">
                  {run.conclusion === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]" /> : 
                   run.conclusion === 'failure' ? <XCircle className="w-4 h-4 text-rose-500 mr-2.5 shrink-0 drop-shadow-[0_0_2px_rgba(244,63,94,0.5)]" /> : 
                   <Clock className="w-4 h-4 text-amber-400 mr-2.5 shrink-0 animate-pulse" />}
                  <span className="truncate text-slate-300">{run.name || run.display_title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider shrink-0 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {new Date(run.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
