import * as fs from "fs";
import * as zlib from "zlib";
import * as Calculator from "../calculator";
import { decorateDiffText, decorateUnit } from "../decorator";

export interface Item {
  /** File name */
  name: string;
  /** file path from repository root */
  path: string;
  /** file size (bytes)) */
  sizeByte: number;
  /** gzip file size (bytes)) */
  gzipSizeByte: number;
}

export interface Group {
  name: string;
  version: string;
  description?: string;
  items: Item[];
}

export interface Comparison {
  /** filename */
  filename: string;
  /** percentage */
  fileSizeDiff: number;
  /** percentage */
  gzipFileSizeDiff: number;
  prevFileSizeByte: number;
  currentGzipFileSizeByte: number;
  prevGzipSizeByte: number;
  currentFileSizeByte: number;
}

/** 新旧の情報を比較した一次元のデータを提供する */
export const generateComparison = (previous: Item | undefined, current: Item): Comparison => {
  return {
    filename: current.name,
    fileSizeDiff: Calculator.diff(previous && previous.sizeByte, current.sizeByte),
    gzipFileSizeDiff: Calculator.diff(previous && previous.gzipSizeByte, current.gzipSizeByte),
    prevFileSizeByte: previous ? previous.sizeByte : NaN,
    currentFileSizeByte: current.sizeByte,
    prevGzipSizeByte: previous ? previous.gzipSizeByte : NaN,
    currentGzipFileSizeByte: current.gzipSizeByte,
  };
};

export const bytesToKB = (byte: number): number => {
  return byte / 1000;
};

export const markdownTableHeader: string[] = [
  "**File**",
  "**File size Diff**",
  "**Gzip size Diff**",
  "**Prev file size**",
  "**Current file size**",
  "**Prev gzip size**",
  "**Current gzip size**",
];

export const markdownTableAlign: string[] = ["l", "r", "r", "r", "r", "r", "r"];

export const generateMarkdownRow = (c: Comparison): string[] => {
  return [
    c.filename,
    decorateDiffText(c.fileSizeDiff, "%"),
    decorateDiffText(c.gzipFileSizeDiff, "%"),
    decorateUnit(bytesToKB(c.prevFileSizeByte), "KB"),
    decorateUnit(bytesToKB(c.currentFileSizeByte), "KB"),
    decorateUnit(bytesToKB(c.prevGzipSizeByte), "KB"),
    decorateUnit(bytesToKB(c.currentGzipFileSizeByte), "KB"),
  ];
};

export interface Profile {
  sizeByte: number;
  gzipSizeByte: number;
}

export const generateProfile = (filename: string): Profile => {
  const text = fs.readFileSync(filename);
  const buffer = Buffer.from(text);
  const gzip = zlib.gzipSync(buffer);
  return {
    sizeByte: fs.statSync(filename).size,
    gzipSizeByte: gzip.byteLength,
  };
};
