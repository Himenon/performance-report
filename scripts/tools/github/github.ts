import { Octokit } from "@octokit/rest";

const env = (name: string): string => {
  const value = process.env[name];
  if (typeof value !== "string") {
    throw new Error(`${name} not found in environment.`);
  }
  return value;
};

const github = new Octokit({
  baseUrl: env("GITHUB_API_URL"),
  auth: env("GITHUB_TOKEN"),
});

const [owner, repo] = env("GITHUB_REPOSITORY").split("/");

await github.issues.createComment({
  owner,
  repo,
  issue_number: prNumber,
  body: message,
});
