import { context } from "@actions/github";
import { s, i } from "./utils";

export interface Params {
  isPullRequest: boolean;
}

export const setEnv = ({ isPullRequest }: Params): void => {
  process.env.PERF_ISSUE_NUMBER = `${context.issue.number}`;
  process.env.PERF_REPO_OWNER = context.repo.owner;
  process.env.PERF_REPO_NAME = context.repo.repo;
  process.env.PERF_COMMIT_SHA = context.sha;
  process.env.PERF_BASE_REF = isPullRequest ? process.env.GITHUB_BASE_REF : context.ref.replace("refs/heads/", "");
};

export interface Env {
  issueNumber: number;
  repoOwner: string;
  repoName: string;
  commitSha: string;
  baseRef: string;
  githubToken: string;
  datalakeGitHubToken: string;
}

export const getEnv = (): Env => {
  return {
    issueNumber: i("PERF_ISSUE_NUMBER", process.env.PERF_ISSUE_NUMBER),
    repoOwner: s("PERF_REPO_OWNER", process.env.PERF_REPO_OWNER),
    repoName: s("PERF_REPO_NAME", process.env.PERF_REPO_NAME),
    commitSha: s("PERF_COMMIT_SHA", process.env.PERF_COMMIT_SHA),
    baseRef: s("PERF_BASE_REF", process.env.PERF_BASE_REF),
    githubToken: s("GITHUB_TOKEN", process.env.GITHUB_TOKEN),
    datalakeGitHubToken: s("DATALAKE_GITHUB_TOKEN", process.env.DATALAKE_GITHUB_TOKEN),
  };
};
