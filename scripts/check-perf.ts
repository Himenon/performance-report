/* eslint-disable @typescript-eslint/no-var-requires */
import { EOL } from "os";
import * as path from "path";
import * as GitControl from "@himenon/git-control-js";
import * as PerformanceReport from "../lib";
import * as fs from "fs";
import * as Exectime from "@himenon/exectime";
import * as GitHubActions from "./tools/actions";
const pkg = require("../package.json");

const applicationRoot = path.join(__dirname, "../");
const workingDirectory = path.join(applicationRoot, ".perf");

const gitConfig: GitControl.IO.Config = {
  baseUrl: "https://github.com",
  baseSsh: "git@github.com",
  owner: "Himenon",
  repo: "performance-datalake",
  branch: "main",
};

const getExecTimeJson = (): Exectime.PerformanceMeasurementResult => {
  const jsonPath = process.env.EXECTIME_OUTPUT_PATH;
  if (typeof jsonPath !== "string") {
    throw new Error("Not found exectime output file.");
  }
  const text = fs.readFileSync(jsonPath, { encoding: "utf-8" });
  return JSON.parse(text);
};

const convertExectime = (result: Exectime.PerformanceMeasurementResult): PerformanceReport.Exectime.Measurement => {
  return result.data.reduce<PerformanceReport.Exectime.Measurement>((all, current) => {
    return { ...all, [current.name]: { startDateUnixTimeMs: current.startDateUnixTimeMs, durationMs: current.durationMs } };
  }, {});
};

const main = async () => {
  const meta = await PerformanceReport.generateMeta({ rootPath: applicationRoot, owner: gitConfig.owner, repo: gitConfig.repo });
  const filesize: PerformanceReport.Filesize.InitialParams = {
    snapshot: {
      filename: path.join(workingDirectory, pkg.name, "filesize.json"),
    },
    meta,
    packages: [
      {
        name: `${pkg.name}`,
        version: `${pkg.version}`,
        items: {
          "package.json": {
            absolutePath: path.join(applicationRoot, "package.json"),
          },
        },
      },
    ],
  };

  const result = getExecTimeJson();

  await GitHubActions.notify("hey!");
  const exectime: PerformanceReport.Exectime.InitialParams = {
    snapshot: {
      filename: path.join(workingDirectory, pkg.name, "exectime.json"),
    },
    meta,
    results: [
      {
        name: "performance-report",
        description: "self repository performance report.",
        measurement: convertExectime(result),
      },
    ],
  };

  const config: PerformanceReport.Config = {
    reporter: {
      filesize,
      exectime,
    },
    gitConfig,
    applicationRoot,
    workingDirectory,
  };
  const report = await PerformanceReport.generate(config);
  const text = [report.markdown.exectime, report.markdown.filesize].join(EOL);
  await GitHubActions.notify(text);
  report.clearWorkingDirectory();
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
