import { createPerformanceReport, Config } from "./tools/check-perf";

createPerformanceReport(Config.taskId.merge, true).catch(error => {
  console.error(error);
  process.exit(1);
});
