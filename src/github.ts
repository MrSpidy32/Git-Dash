import { Octokit } from '@octokit/rest';

let octokit: Octokit | null = null;

export const initGithub = (token: string) => {
  octokit = new Octokit({ auth: token });
  return octokit;
};

export const getClient = () => {
  if (!octokit) throw new Error("GitHub client not initialized");
  return octokit;
};

// --- Billing ---
export const getBilling = async (login: string, type: 'user' | 'org') => {
  const client = getClient();
  const endpoint = type === 'org' 
    ? `/organizations/${login}/settings/billing/usage` 
    : `/users/${login}/settings/billing/usage`;
  
  const { data } = await client.request(`GET ${endpoint}`, {
    headers: {
      'X-GitHub-Api-Version': '2026-03-10'
    }
  });
  return data;
};

// --- Repos ---
export const getRepos = async (login: string, type: 'user' | 'org') => {
  const client = getClient();
  if (type === 'org') {
    const { data } = await client.repos.listForOrg({ org: login, per_page: 100, sort: 'updated' });
    return data;
  } else {
    const { data } = await client.repos.listForAuthenticatedUser({ per_page: 100, sort: 'updated', affiliation: 'owner,collaborator' });
    return data;
  }
};

// --- Workflows ---
export const getWorkflows = async (owner: string, repo: string) => {
  const client = getClient();
  const { data } = await client.actions.listRepoWorkflows({ owner, repo });
  return data.workflows;
};

export const toggleWorkflow = async (owner: string, repo: string, workflowId: number, enable: boolean) => {
  const client = getClient();
  if (enable) {
    await client.actions.enableWorkflow({ owner, repo, workflow_id: workflowId });
  } else {
    await client.actions.disableWorkflow({ owner, repo, workflow_id: workflowId });
  }
};

export const getWorkflowRuns = async (owner: string, repo: string) => {
  const client = getClient();
  const { data } = await client.actions.listWorkflowRunsForRepo({ owner, repo, per_page: 30 });
  return data.workflow_runs;
};

// --- Runners ---
export const getRunners = async (login: string, type: 'user' | 'org') => {
  const client = getClient();
  if (type === 'org') {
    const { data } = await client.actions.listSelfHostedRunnersForOrg({ org: login });
    return data.runners;
  }
  return []; // Currently self-hosted runners via API are mostly for orgs/repos. Repo level handled separately if needed.
};

// Auth Verification
export const verifyToken = async (token: string) => {
  const client = new Octokit({ auth: token });
  const { data: user } = await client.users.getAuthenticated();
  
  // Get orgs to check if we want to add an org context instead
  const { data: orgs } = await client.orgs.listForAuthenticatedUser();
  
  return { user, orgs };
};
