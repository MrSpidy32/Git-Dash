export type AccountType = 'user' | 'org';

export interface Account {
  id: string; // usually the login
  login: string;
  token: string;
  type: AccountType;
}

const STORAGE_KEY = 'gitdash_accounts';

export const getAccounts = (): Account[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAccounts = (accounts: Account[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

export const addAccount = (account: Account) => {
  const accounts = getAccounts();
  const existing = accounts.findIndex(a => a.id === account.id);
  if (existing >= 0) {
    accounts[existing] = account;
  } else {
    accounts.push(account);
  }
  saveAccounts(accounts);
};

export const removeAccount = (id: string) => {
  saveAccounts(getAccounts().filter(a => a.id !== id));
};
