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

export const markdownTableHeader: string[] = ["**Command**", "**Time diff**", "**prev time**", "**current time**"];

export const markdownTableAlign: string[] = ["l", "r", "r", "r", "r", "r", "r"];

const msToSec = (ms: number): number => {
  return ms / 1000;
};

export const generateMarkdownRow = (c: Comparison): string[] => {
  return [
    c.execCommandName,
    decorateDiffText(c.execCommandDurationDiff, "%"),
    decorateUnit(msToSec(c.prevExecuteDurationMs), "sec"),
    decorateUnit(msToSec(c.currentExecuteDurationMs), "sec"),
  ];
};
