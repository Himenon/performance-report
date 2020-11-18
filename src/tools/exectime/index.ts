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

export interface AdditionalColumn {
  /** average Diff */
  averageDiff: Array<(Comparison & { averageTimes: number | "all" | undefined }) | undefined>;
}

export const generateMarkdownRow = (c: Comparison, additionalColumn: AdditionalColumn): string[] => {
  const averageColumn = additionalColumn.averageDiff
    .map(additionalComparison => [
      decorateUnit(msToSec(additionalComparison && additionalComparison.currentExecuteDurationMs), "sec"),
      decorateDiffText(additionalComparison && additionalComparison.execCommandDurationDiff, "%"),
    ])
    .flat();
  return [
    c.execCommandName,
    decorateUnit(msToSec(c.currentExecuteDurationMs), "sec"),
    decorateUnit(msToSec(c.prevExecuteDurationMs), "sec"),
    decorateDiffText(c.execCommandDurationDiff, "%"),
  ].concat(averageColumn);
};
