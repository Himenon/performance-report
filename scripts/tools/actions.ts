// import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";

const github = getOctokit(process.env.GITHUB_TOKEN!);

const botName = "github-actions[bot]";

export const getBaseReference = (isPullRequest: boolean): string => {
  if (isPullRequest) {
    return process.env.GITHUB_BASE_REF!; // = main
  }
  return context.ref.replace("refs/heads/", ""); // context.ref = refs/heads/main
};

export const notify = async (body: string): Promise<void> => {
  await github.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: body,
  });
};

export const createOrUpdateComment = async (message: string, taskId: string): Promise<void> => {
  const comments = (
    await github.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
    })
  ).data.filter(comment => {
    if (taskId) {
      return comment.body.match(new RegExp(taskId)) && comment.user.login === botName;
    }
    return comment.user.login === botName;
  });
  if (comments.length > 0) {
    const firstComment = comments[0];
    await github.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: firstComment.id,
      body: message,
    });
  } else {
    notify(message);
  }
};

export const generateMeta = (isPullRequest: boolean) => {
  return {
    git: {
      ref: getBaseReference(isPullRequest),
      sha: context.sha,
      repoName: context.repo.repo,
      owner: context.repo.owner,
    },
  };
};
