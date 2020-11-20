export interface RepositoryUrlOption {
  baseUrl: string;
  owner: string;
  repo: string;
}

export const generateRepositoryUrl = ({ baseUrl, owner, repo }: RepositoryUrlOption): string => {
  return [baseUrl, owner, repo].join("/");
};

export interface CommitOption {
  repositoryUrl: string;
  sha: string;
}

export const generateCommitUrl = ({ repositoryUrl, sha }: CommitOption): string => {
  return [repositoryUrl, "commit", sha].join("/");
};

export interface CompareUrlOption {
  repositoryUrl: string;
  baseSha: string;
  headSha: string;
}

export const generateCompareUrl = ({ repositoryUrl, baseSha, headSha }: CompareUrlOption): string => {
  return `${repositoryUrl}/compare/${baseSha}...${headSha}`;
};

export const generateMarkdownLink = (text: string, url?: string): string => {
  if (!url) {
    return text;
  }
  return `[${text}](${url})`;
};
