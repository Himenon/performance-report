import { createPerformanceReport } from "./tools/check-perf";

createPerformanceReport({ isPullRequest: false, isLocal: false }).catch(error => {
  console.error(error);
  process.exit(1);
});
