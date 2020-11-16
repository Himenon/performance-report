import * as fs from "fs";
import * as path from "path";
import * as Meta from "./meta";
import * as Exectime from "./exectime";
import * as Filesize from "./filesize";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../../package.json");

export { Meta, Exectime, Filesize };

type Item = Filesize.Item | Exectime.Item;
type Group = Filesize.Group | Exectime.Group;

export interface History<G extends Group> {
  meta: {
    git: Meta.Git;
  };
  groups: {
    [groupName: string]: G;
  };
}

export interface Snapshot<G extends Group> {
  meta: {
    version: string;
    createdAt: string;
    updatedAt: string;
  };
  histories: History<G>[];
}

export interface Repository<G extends Group> {
  update: () => string | undefined;
  addSnapshot: (newHistory: History<G>) => void;
  getLatestHistory: (query: Partial<Meta.Git>) => History<G> | undefined;
}

export const createSnapshotRepository = <G extends Group>(filename: string): Repository<G> => {
  const createDefaultSnapShpt = (): Snapshot<G> => ({
    meta: {
      version: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    histories: [],
  });
  const getSnapshot = (filename: string): Snapshot<G> => {
    if (fs.existsSync(filename) && fs.statSync(filename).isFile) {
      const text = fs.readFileSync(filename, { encoding: "utf-8" });
      return JSON.parse(text);
    }
    return createDefaultSnapShpt();
  };

  /**
   * 最新が先頭になるようにソートする
   */
  const compareDate = (a?: string, b?: string): 0 | 1 | -1 => {
    if (a && b) {
      // rightが最新の場合(大きい場合)、rightを添字の小さい方に移動するため、負の値を返す
      return new Date(a) < new Date(b) ? 1 : -1;
    }
    // rightが添字がない場合、leftを負にする（添字を減らす）
    if (a && !b) {
      return -1;
    }
    // leftが添え字がない場合、leftを正にする（添字を増やす）
    if (!a && b) {
      return 1;
    }
    return 0;
  };

  const snapshot = getSnapshot(filename);

  const hasSameSHA = (sha: string): boolean => {
    return !!snapshot.histories.find(history => history.meta.git.sha === sha);
  };

  return {
    update: () => {
      const parentDirectory = path.dirname(filename);
      const existParentDirectory = fs.existsSync(parentDirectory) && fs.statSync(parentDirectory).isDirectory;
      if (!existParentDirectory) {
        fs.mkdirSync(parentDirectory, { recursive: true });
      }
      fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2), { encoding: "utf-8" });
      return filename;
    },
    addSnapshot: newHistory => {
      if (hasSameSHA(newHistory.meta.git.sha)) {
        return;
      }
      snapshot.meta.version = pkg.version;
      snapshot.meta.updatedAt = new Date().toISOString();
      snapshot.histories.push(newHistory);
    },
    getLatestHistory: query => {
      return snapshot.histories
        .sort((a, b) => compareDate(a.meta.git.mergeDateAt, b.meta.git.mergeDateAt))
        .find(history => {
          return history.meta.git.branch === query.branch;
        });
    },
  };
};

export interface GroupComparisons<Comparison extends Exectime.Comparison | Filesize.Comparison> {
  [groupName: string]: Comparison[];
}

export const findPreviousGroup = <G extends Group>(history: History<G> | undefined, groupName: string): G | undefined => {
  return history && history.groups[groupName];
};

export interface FindPreviousItem {
  (previousGroup: Filesize.Group, currentItem: Filesize.Item): Filesize.Item | undefined;
  (previousGroup: Exectime.Group, currentItem: Exectime.Item): Exectime.Item | undefined;
}

export const findPreviousItem: FindPreviousItem = (previousGroup: any, currentItem: Item) => {
  return previousGroup && previousGroup.items.find((item: Item) => currentItem.name === item.name);
};
