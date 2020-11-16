import * as fs from "fs";
import * as PerformanceReport from "../../lib";
import * as Exectime from "@himenon/exectime";

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

export const generateExectimeMeasure = (): PerformanceReport.Exectime.Measurement => {
  const result = getExecTimeJson();
  return convertExectime(result);
};
