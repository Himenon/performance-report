import { createPerformanceReport } from "./tools/check-perf";

createPerformanceReport(true).catch(error => {
  console.error(error);
  process.exit(1);
});
