import React, { useState, useEffect } from 'react';
import type { Account } from '../store';
import { getRepos, getWorkflows, toggleWorkflow, getWorkflowRuns } from '../github';
import { CheckCircle2, XCircle, Clock, Power } from 'lucide-react';

interface Props {
  account: Account;
}

export function RepoPanel({ account }: Props) {
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

  if (loading) return <div className="text-center py-10">Loading Repositories...</div>;

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="p-3 text-sm font-semibold text-gray-600">Repository</th>
            <th className="p-3 text-sm font-semibold text-gray-600">Visibility</th>
            <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {repos.map(repo => (
            <React.Fragment key={repo.id}>
              <tr 
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedRepo(expandedRepo === repo.name ? null : repo.name)}
              >
                <td className="p-3 font-medium text-blue-600">{repo.name}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${repo.private ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                    {repo.private ? 'Private' : 'Public (Free)'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {expandedRepo === repo.name ? 'Hide Details' : 'View Workflows'}
                </td>
              </tr>
              {expandedRepo === repo.name && (
                <tr>
                  <td colSpan={3} className="p-0 border-b">
                    <RepoDetails owner={account.login} repo={repo.name} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
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
      // Optimistic update
      setWorkflows(workflows.map(w => w.id === wf.id ? { ...w, state: isEnabling ? 'active' : 'disabled_manually' } : w));
    } catch (e) {
      alert('Failed to toggle workflow');
    }
  };

  if (loading) return <div className="p-4 bg-gray-50 text-sm text-center">Loading details...</div>;

  return (
    <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Workflows List & Toggle */}
      <div>
        <h4 className="font-bold mb-2 text-sm">Workflows</h4>
        {workflows.length === 0 ? <p className="text-xs text-gray-500">No workflows found.</p> : (
          <ul className="space-y-2">
            {workflows.map(wf => (
              <li key={wf.id} className="flex justify-between items-center bg-white p-2 border rounded text-sm">
                <span className={wf.state !== 'active' ? 'text-gray-400' : ''}>{wf.name}</span>
                <button 
                  onClick={() => handleToggle(wf)}
                  className={`flex items-center px-2 py-1 rounded text-xs text-white ${wf.state === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  <Power className="w-3 h-3 mr-1"/>
                  {wf.state === 'active' ? 'Disable' : 'Enable'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Runs */}
      <div>
        <h4 className="font-bold mb-2 text-sm">Recent Runs</h4>
        {runs.length === 0 ? <p className="text-xs text-gray-500">No runs found.</p> : (
          <ul className="space-y-2">
            {runs.slice(0, 5).map(run => (
              <li key={run.id} className="flex justify-between items-center bg-white p-2 border rounded text-sm">
                <div className="flex items-center truncate pr-2">
                  {run.conclusion === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> : 
                   run.conclusion === 'failure' ? <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" /> : 
                   <Clock className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />}
                  <span className="truncate">{run.name || run.display_title}</span>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(run.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
