import { createPerformanceReport } from "./tools/check-perf";

createPerformanceReport(false).catch(error => {
  console.error(error);
  process.exit(1);
});
