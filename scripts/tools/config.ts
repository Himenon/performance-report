import * as path from "path";
import * as GitControl from "@himenon/git-control-js";

export const gitConfig: GitControl.IO.Config = {
  baseUrl: "https://github.com",
  baseSsh: "git@github.com",
  owner: "Himenon",
  repo: "performance-datalake",
  branch: "main",
};

export const applicationRoot = path.join(__dirname, "../../");
export const workingDirectory = path.join(applicationRoot, ".perf");
export const snapshot = {
  filesize: "filesize.json",
  exectime: "exectime.json",
};

export const taskId = {
  pr: "performanceReportId:pull-request",
  merge: "performanceReportId:merge",
};

export const git = {
  config: gitConfig,
  username: "github-actions[bot]",
  email: "actions@gihub.com",
};
