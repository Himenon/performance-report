import { context as githubActionContext, getOctokit } from "@actions/github";

const botName = "github-actions[bot]";

export interface Option {
  isLocal: boolean;
}

export const create = (option: Option) => {
  const github = !option.isLocal ? getOctokit(process.env.GITHUB_TOKEN!) : ({} as ReturnType<typeof getOctokit>);

  const getContext = (isLocal: boolean): typeof githubActionContext => {
    if (isLocal) {
      return {
        ref: "refs/head/main",
        sha: "dummy-sha",
        issue: {
          number: 1,
          owner: "dummy-owner",
          repo: "dummy-repo",
        },
        repo: {
          owner: "dummy-owner",
          repo: "dummy-repo",
        },
      } as typeof githubActionContext;
    }
    return githubActionContext;
  };

  const context = getContext(option.isLocal);

  const getBaseReference = (isPullRequest: boolean): string => {
    if (isPullRequest) {
      return process.env.GITHUB_BASE_REF!; // = main
    }
    return context.ref.replace("refs/heads/", ""); // context.ref = refs/heads/main
  };

  const notify = async (body: string): Promise<void> => {
    await github.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: body,
    });
  };

  const createOrUpdateComment = async (message: string, taskId: string): Promise<void> => {
    if (option.isLocal) {
      return;
    }
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

  const generateMeta = (isPullRequest: boolean) => {
    return {
      git: {
        ref: getBaseReference(isPullRequest),
        sha: context.sha,
        repoName: context.repo.repo,
        owner: context.repo.owner,
      },
    };
  };

  return {
    notify,
    getBaseReference,
    createOrUpdateComment,
    generateMeta,
  };
};
