import { useState, useEffect } from 'react';
import type { Account } from '../store';
import { getAccounts, addAccount, removeAccount } from '../store';
import { verifyToken, initGithub } from '../github';
import { Plus, Key, X, ChevronDown } from 'lucide-react';

interface Props {
  onAccountSelect: (account: Account | null) => void;
}

export function AccountManager({ onAccountSelect }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);
  
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
      
      const newAcc: Account = {
        id: user.login,
        login: user.login,
        token: token,
        type: 'user'
      };
      
      addAccount(newAcc);
      
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
    <div className="flex items-center space-x-3 relative">
      {accounts.length > 0 && (
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full pl-3 pr-1 py-1">
          <div className="relative">
            <select 
              className="appearance-none bg-transparent border-none text-sm text-slate-200 font-mono pr-6 focus:outline-none cursor-pointer"
              value={activeId}
              onChange={(e) => {
                const acc = accounts.find(a => a.id === e.target.value);
                if (acc) selectAccount(acc);
              }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-slate-200">
                  {acc.login} [{acc.type}]
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button 
            onClick={(e) => handleRemove(e, activeId)}
            className="ml-2 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-full transition-colors"
            title="Remove account"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <button 
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-full hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
      >
        <Plus className="w-4 h-4 mr-1" /> Connect
      </button>

      {showAdd && (
        <div className="absolute top-12 right-0 bg-slate-900/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-slate-800 w-80 z-50">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
            <Key className="w-4 h-4 mr-2 text-cyan-400"/> Authenticate
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Requires Classic PAT with scopes: <span className="text-cyan-400 font-mono bg-cyan-400/10 px-1 rounded">repo, workflow, user, admin:org</span>
          </p>
          <form onSubmit={handleAdd}>
            <input 
              type="password"
              placeholder="ghp_..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mb-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 font-mono transition-all"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
            {error && <p className="text-rose-400 text-xs mb-3">{error}</p>}
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="text-xs font-medium bg-cyan-500 text-slate-950 px-4 py-1.5 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {loading ? 'Verifying...' : 'Initialize'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
