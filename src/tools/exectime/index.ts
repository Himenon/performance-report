import * as Calculator from "../calculator";
import { decorateDiffText, decorateUnit } from "../decorator";

export interface Item {
  /** Command Name */
  name: string;
  /** unix time */
  startDateUnixTimeMs: number;
  /** duration ms */
  durationMs: number;
}

export interface Group {
  /** Group Name */
  name: string;
  /** Group description */
  description?: string;
  /** Group items */
  items: Item[];
}

export interface Comparison {
  /** Execute Command Name  */
  execCommandName: string;
  /** percentage */
  execCommandDurationDiff: number;
  /** milliseconds */
  prevExecuteDurationMs: number;
  /** milliseconds */
  currentExecuteDurationMs: number;
}

export const generateComparison = (previous: Item | undefined, current: Item): Comparison => {
  return {
    execCommandName: current.name,
    execCommandDurationDiff: Calculator.diff(previous && previous.durationMs, current.durationMs),
    prevExecuteDurationMs: previous ? previous.durationMs : NaN,
    currentExecuteDurationMs: current.durationMs,
  };
};

export const markdownTableHeader: string[] = ["**Command**", "**current time**", "**prev time**", "**Time diff**"];

export const markdownTableAlign: string[] = ["l", "r", "r", "r", "r", "r", "r"];

const msToSec = (ms: number | undefined): number => {
  if (ms === undefined) {
    return NaN;
  }
  return ms / 1000;
};

export type AverageColumn = Comparison & { averageTimes: number | "all" | undefined };

export interface AdditionalColumn {
  /** average Diff */
  averageDiff: Array<AverageColumn | undefined>;
}

export const generateMarkdownRow = (comparison: Comparison, additionalColumn: AdditionalColumn): string[] => {
  const averageColumn = additionalColumn.averageDiff
    .map(additionalComparison => [
      decorateUnit(msToSec(additionalComparison && additionalComparison.prevExecuteDurationMs), "sec"), // 前回 = 平均
      decorateDiffText(additionalComparison && additionalComparison.execCommandDurationDiff, "%"),
    ])
    .flat();
  return [
    comparison.execCommandName,
    decorateUnit(msToSec(comparison.currentExecuteDurationMs), "sec"),
    decorateUnit(msToSec(comparison.prevExecuteDurationMs), "sec"),
    decorateDiffText(comparison.execCommandDurationDiff, "%"),
  ].concat(averageColumn);
};
