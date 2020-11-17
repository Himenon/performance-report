import { createPerformanceReport } from "./tools/check-perf";

createPerformanceReport({ isPullRequest: true, isLocal: false }).catch(error => {
  console.error(error);
  process.exit(1);
});
