import { useState, useEffect } from 'react';
import type { Account } from '../store';
import { getRunners } from '../github';
import { Server, Tag } from 'lucide-react';

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
      setRunners([]); // User account runners not explicitly supported at top level
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

  if (account.type === 'user') return <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center">Self-hosted runner list is available for Organizations.</div>;
  if (loading) return <div className="text-center py-6 text-sm">Loading Runners...</div>;
  if (error) return null;

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <Server className="w-5 h-5 mr-2" /> Self-Hosted Runners
        </h2>
        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">Free Minutes</span>
      </div>

      {runners.length === 0 ? (
        <p className="text-sm text-gray-500">No self-hosted runners configured for this organization.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="pb-2">Name</th>
              <th className="pb-2">OS</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Labels</th>
            </tr>
          </thead>
          <tbody>
            {runners.map(r => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{r.name}</td>
                <td className="py-3 text-gray-600">{r.os}</td>
                <td className="py-3">
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${r.status === 'online' ? (r.busy ? 'bg-yellow-400' : 'bg-green-500') : 'bg-red-500'}`}></span>
                    {r.status === 'online' ? (r.busy ? 'Busy' : 'Idle') : 'Offline'}
                  </div>
                </td>
                <td className="py-3 flex gap-1 flex-wrap">
                  {r.labels.map((l: any) => (
                    <span key={l.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border flex items-center">
                      <Tag className="w-3 h-3 mr-1" /> {l.name}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
