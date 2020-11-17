/* eslint-disable @typescript-eslint/no-var-requires */
import { EOL } from "os";
import * as path from "path";
import * as PerformanceReport from "../../lib";
import * as GitHubActions from "./actions";
import * as Exectime from "./exectime";
import * as Config from "./config";
const pkg = require("../../package.json");

const generateHideComment = (value: string): string => `<!-- ${value} -->`;

export const createPerformanceReport = async (isPullRequest: boolean): Promise<void> => {
  const taskId = isPullRequest ? Config.taskId.pr : Config.taskId.merge;
  const meta = GitHubActions.generateMeta();
  const filesize: PerformanceReport.Filesize.InitialParams = {
    snapshot: {
      filename: path.join(Config.workingDirectory, pkg.name, Config.snapshot.filesize),
    },
    meta,
    packages: [
      {
        name: `${pkg.name}`,
        version: `${pkg.version}`,
        items: {
          "package.json": {
            absolutePath: path.join(Config.applicationRoot, "package.json"),
          },
        },
      },
    ],
  };

  const exectime: PerformanceReport.Exectime.InitialParams = {
    snapshot: {
      filename: path.join(Config.workingDirectory, pkg.name, Config.snapshot.exectime),
    },
    meta,
    results: [
      {
        name: pkg.name,
        description: "self repository performance report.",
        measurement: Exectime.generateExectimeMeasure(),
      },
    ],
  };

  const config: PerformanceReport.Config = {
    reporter: {
      filesize,
      exectime,
    },
    git: Config.gitConfig,
    applicationRoot: Config.applicationRoot,
    workingDirectory: Config.workingDirectory,
  };

  const report = await PerformanceReport.generate(config);

  if (isPullRequest) {
    const text = [report.markdown.exectime, report.markdown.filesize, generateHideComment(taskId)].join(EOL + EOL);
    await GitHubActions.createOrUpdateComment(text, taskId);
  }

  if (!isPullRequest) {
    await report.sync();
  }

  report.clearWorkingDirectory();
};
