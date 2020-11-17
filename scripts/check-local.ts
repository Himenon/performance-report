import { createPerformanceReport } from "./tools/check-perf";

createPerformanceReport({ isPullRequest: true, isLocal: true }).catch(error => {
  console.error(error);
  process.exit(1);
});
