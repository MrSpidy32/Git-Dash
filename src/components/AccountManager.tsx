import { useState, useEffect } from 'react';
import type { Account } from '../store';
import { getAccounts, addAccount, removeAccount } from '../store';
import { verifyToken, initGithub } from '../github';
import { Plus, Key } from 'lucide-react';

interface Props {
  onAccountSelect: (account: Account | null) => void;
}

export function AccountManager({ onAccountSelect }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);
  
  // Add form state
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const accs = getAccounts();
    setAccounts(accs);
    if (accs.length > 0) {
      selectAccount(accs[0]);
    }
  }, []);

  const selectAccount = (acc: Account) => {
    setActiveId(acc.id);
    initGithub(acc.token);
    onAccountSelect(acc);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { user, orgs } = await verifyToken(token);
      
      // Default to adding the user account
      const newAcc: Account = {
        id: user.login,
        login: user.login,
        token: token,
        type: 'user'
      };
      
      addAccount(newAcc);
      
      // Also add their orgs automatically
      orgs.forEach(org => {
        addAccount({
          id: org.login,
          login: org.login,
          token: token,
          type: 'org'
        });
      });
      
      const updated = getAccounts();
      setAccounts(updated);
      selectAccount(updated.find(a => a.id === newAcc.id) || updated[0]);
      setShowAdd(false);
      setToken('');
    } catch (err: any) {
      setError(err.message || 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeAccount(id);
    const updated = getAccounts();
    setAccounts(updated);
    if (activeId === id) {
      const next = updated[0] || null;
      if (next) selectAccount(next);
      else {
        setActiveId('');
        onAccountSelect(null);
      }
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {accounts.length > 0 && (
        <div className="flex items-center">
          <select 
            className="border border-gray-300 rounded-l px-3 py-1.5 bg-white text-sm"
            value={activeId}
            onChange={(e) => {
              const acc = accounts.find(a => a.id === e.target.value);
              if (acc) selectAccount(acc);
            }}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.login} ({acc.type})
              </option>
            ))}
          </select>
          <button 
            onClick={(e) => handleRemove(e, activeId)}
            className="bg-red-100 text-red-600 px-2 py-1.5 border border-l-0 border-gray-300 rounded-r hover:bg-red-200 text-sm"
            title="Remove account"
          >
            X
          </button>
        </div>
      )}

      <button 
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-1" /> Add Account
      </button>

      {showAdd && (
        <div className="absolute top-16 right-4 bg-white p-4 rounded shadow-lg border w-80 z-50">
          <h3 className="font-bold mb-2 flex items-center"><Key className="w-4 h-4 mr-2"/> Add GitHub Token</h3>
          <p className="text-xs text-gray-500 mb-4">Needs scopes: repo, workflow, read:user, read:org, admin:org</p>
          <form onSubmit={handleAdd}>
            <input 
              type="password"
              placeholder="ghp_..."
              className="w-full border rounded px-2 py-1 mb-2 text-sm"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowAdd(false)} className="text-xs px-2 py-1 text-gray-600">Cancel</button>
              <button type="submit" disabled={loading} className="text-xs bg-blue-600 text-white px-3 py-1 rounded">
                {loading ? 'Verifying...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
