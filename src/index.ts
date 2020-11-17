import * as Meta from "./tools/meta";
import * as Exectime from "./exectime";
import * as Filesize from "./filesize";
import * as GitControl from "@himenon/git-control-js";
import * as rimraf from "rimraf";

export { Meta, Exectime, Filesize };

export interface GitParams {
  config: Omit<GitControl.IO.Params, "cmd" | "workingDir" | "outputDir">;
  username: string;
  email: string;
}

export interface Config {
  reporter: {
    exectime?: Exectime.InitialParams;
    filesize?: Filesize.InitialParams;
  };
  git: GitParams;
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

export const generate = async (params: Config): Promise<Report> => {
  const { workingDirectory, git, reporter } = params;
  const cmd = GitControl.Command.create(workingDirectory);
  const io = GitControl.IO.create({ ...git.config, workingDir: workingDirectory, cmd });
  await io.setup();
  await io.setConfig("user.name", git.username, "local");
  await io.setConfig("user.email", git.email, "local");
  const comparison: Comparison = {};
  const markdown: Markdown = {};
  if (reporter.filesize) {
    const filesize = Filesize.create(reporter.filesize);
    comparison.filesize = filesize.getGroupComparisons();
    markdown.filesize = filesize.getMarkdownComparisons();
    filesize.update();
  }
  if (reporter.exectime) {
    const exectime = Exectime.create(reporter.exectime);
    comparison.exectime = exectime.getGroupComparisons();
    markdown.exectime = exectime.getMarkdownComparisons();
    exectime.update();
  }
  await io.addAll();
  await io.createCommit(params.commitMessage || "chore: update performance data.");
  return {
    comparison,
    markdown,
    sync: async () => {
      await io.push();
    },
    clearWorkingDirectory: () => {
      rimraf.sync(workingDirectory);
    },
  };
};
