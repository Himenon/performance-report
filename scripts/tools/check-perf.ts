/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from "fs";
import { EOL } from "os";
import * as path from "path";
import * as PerformanceReport from "../../lib";
import * as GitHubActions from "./actions";
import * as Exectime from "./exectime";
import * as Config from "./config";
const pkg = require("../../package.json");

const generateHideComment = (value: string): string => `<!-- ${value} -->`;

export interface Option {
  isPullRequest: boolean;
  isLocal: boolean;
}

export const createPerformanceReport = async ({ isPullRequest, isLocal }: Option): Promise<void> => {
  const taskId = isPullRequest ? Config.taskId.pr : Config.taskId.merge;
  const gitHubActions = GitHubActions.create({ isLocal });
  const meta = gitHubActions.generateMeta(isPullRequest);

  const option: PerformanceReport.Option = {
    snapshot: {
      minimize: true,
    },
    filesize: {
      applicationRoot: Config.applicationRoot,
    },
    exectime: {
      averageList: [2, "all"],
    },
  };

  const query = {
    git: {
      base: {
        ref: gitHubActions.getBaseReference(isPullRequest),
      },
    },
  };

  const filesize: PerformanceReport.Filesize.InitialParams = {
    snapshot: {
      filename: path.join(Config.workingDirectory, pkg.name, Config.snapshot.filesize),
    },
    meta,
    query,
    packages: [
      {
        name: `${pkg.name}-seed`,
        version: `${pkg.version}`,
        items: {
          "package.json": {
            absolutePath: path.join(Config.applicationRoot, "package.json"),
          },
        },
      },
      {
        name: `${pkg.name}-cjs`,
        version: `${pkg.version}`,
        items: {
          "$cjs/index.js": {
            absolutePath: path.join(Config.applicationRoot, "lib/$cjs/index.js"),
          },
          "$cjs/exectime.js": {
            absolutePath: path.join(Config.applicationRoot, "lib/$cjs/exectime.js"),
          },
          "$cjs/filesize.js": {
            absolutePath: path.join(Config.applicationRoot, "lib/$cjs/filesize.js"),
          },
        },
      },
      {
        name: `${pkg.name}-esm`,
        version: `${pkg.version}`,
        items: {
          "$esm/index.js": {
            absolutePath: path.join(Config.applicationRoot, "lib/$esm/index.js"),
          },
          "$esm/exectime.js": {
            absolutePath: path.join(Config.applicationRoot, "lib/$esm/exectime.js"),
          },
          "$esm/filesize.js": {
            absolutePath: path.join(Config.applicationRoot, "lib/$esm/filesize.js"),
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
    query,
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

  const report = await PerformanceReport.generate(config, option);

  if (isPullRequest) {
    const text = [report.markdown.exectime, report.markdown.filesize, generateHideComment(taskId)].join(EOL + EOL);
    if (isLocal) {
      fs.writeFileSync(".debug/comment.md", text, { encoding: "utf-8" });
    } else {
      await gitHubActions.createOrUpdateComment(text, taskId);
    }
  }

  if (!isPullRequest && !isLocal) {
    await report.sync();
  }

  if (!isLocal) {
    report.clearWorkingDirectory();
  }
};
