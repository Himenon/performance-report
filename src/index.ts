import { EOL } from "os";
import * as Exectime from "./exectime";
import * as Filesize from "./filesize";
import * as GitControl from "@himenon/git-control-js";
import * as rimraf from "rimraf";

export { Exectime, Filesize };

export interface Committer {
  username: string;
  email: string;
}

export interface Git extends Omit<GitControl.Command.CloneOption, "outputDir"> {
  committer: Committer;
}

export interface Config {
  reporter: {
    exectime?: Exectime.InitialParams;
    filesize?: Filesize.InitialParams;
  };
  git: Git;
  applicationRoot: string;
  workingDirectory: string;
  commitMessage?: string;
}

export interface Comparison {
  filesize?: Filesize.GroupComparisons;
  exectime?: Exectime.GroupComparisons;
}

export interface Markdown {
  filesize?: string;
  exectime?: string;
}

export interface Report {
  comparison: Comparison;
  markdown: Markdown;
  sync: () => Promise<void>;
  clearWorkingDirectory: () => void;
}

export type Option = Filesize.Option & Exectime.Option;

export const generate = async (params: Config, option: Option = {}): Promise<Report> => {
  const { workingDirectory, reporter, applicationRoot } = params;
  const { committer, ...cloneOption } = params.git;
  rimraf.sync(workingDirectory);
  const git = GitControl.Wrap.create(workingDirectory);
  const applicationGit = GitControl.Wrap.create(applicationRoot);
  const defaultRemote = "origin";
  let baseRefRevList: string[] = [];
  if (params.reporter.filesize) {
    await applicationGit.fetch({
      target: defaultRemote,
    });
    const list = await applicationGit.getRevListHead({
      remotes: defaultRemote,
      branches: params.reporter.filesize.snapshot.query.git.base.ref,
    });
    baseRefRevList = list.split(EOL);
  }
  await git.clone({
    ...cloneOption,
    outputDir: workingDirectory,
  });
  if (cloneOption.authToken) {
    await git.updateRemote({
      owner: cloneOption.owner,
      repo: cloneOption.repo,
      remote: defaultRemote,
      authToken: cloneOption.authToken,
    });
  }
  await git.setConfig({
    key: "user.name",
    value: committer.username,
  });
  await git.setConfig({
    key: "user.email",
    value: committer.email,
  });
  const comparison: Comparison = {};
  const markdown: Markdown = {};
  if (reporter.filesize) {
    reporter.filesize.snapshot.query.git.revList = baseRefRevList;
    const filesize = Filesize.create(reporter.filesize, { snapshot: option.snapshot, filesize: option.filesize });
    comparison.filesize = filesize.getGroupComparisons();
    markdown.filesize = filesize.getMarkdownComparisons(cloneOption.baseUrl);
    filesize.update();
  }
  if (reporter.exectime) {
    reporter.exectime.snapshot.query.git.revList = baseRefRevList;
    const exectime = Exectime.create(reporter.exectime, { snapshot: option.snapshot, exectime: option.exectime });
    comparison.exectime = exectime.getGroupComparisons();
    markdown.exectime = exectime.getMarkdownComparisons(cloneOption.baseUrl);
    exectime.update();
  }
  await git.add({ all: true });
  await git.commit({
    shortMessage: params.commitMessage || "chore: update performance data.",
  });
  return {
    comparison,
    markdown,
    sync: async () => {
      await git.push({
        remote: defaultRemote,
        branch: cloneOption.branch,
      });
    },
    clearWorkingDirectory: () => {
      rimraf.sync(workingDirectory);
    },
  };
};
