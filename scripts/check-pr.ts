import { createPerformanceReport, Config } from "./tools/check-perf";

createPerformanceReport(Config.taskId.pr, false).catch(error => {
  console.error(error);
  process.exit(1);
});
