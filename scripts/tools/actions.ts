import { Octokit } from "@octokit/rest";
import { getEnv } from "./env";
import * as PerformanceReport from "../../lib";

const botName = "github-actions[bot]";

export const create = () => {
  const { issueNumber, repoOwner, repoName, baseRef, commitSha, githubToken } = getEnv();
  const github = new Octokit({
    auth: githubToken,
  });

  const notify = async (body: string): Promise<void> => {
    await github.issues.createComment({
      issue_number: issueNumber,
      owner: repoOwner,
      repo: repoName,
      body: body,
    });
  };

  const createOrUpdateComment = async (message: string, taskId: string): Promise<void> => {
    const comments = (
      await github.issues.listComments({
        owner: repoOwner,
        repo: repoName,
        issue_number: issueNumber,
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
        owner: repoOwner,
        repo: repoName,
        comment_id: firstComment.id,
        body: message,
      });
    } else {
      notify(message);
    }
  };

  const generateMeta = (): { git: PerformanceReport.Exectime.Git.Meta } => {
    return {
      git: {
        ref: baseRef,
        sha: commitSha,
        repoName: repoName,
        owner: repoOwner,
      },
    };
  };

  return {
    notify,
    createOrUpdateComment,
    generateMeta,
  };
};
