import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";

export const notify = async (body: string): Promise<void> => {
  const token = core.getInput("github-token", { required: true });
  const github = getOctokit(token);

  await github.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: body,
  });
};
