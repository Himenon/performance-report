import * as fs from "fs";
import * as path from "path";
import { History, Snapshot } from "./tools";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");

export interface Meta {
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface Query {
  git: {
    base: {
      ref: string;
    };
  };
}

export interface InitialParams {
  filename: string;
  query: Query;
}

export interface Option {
  /** default: true, JSON.stringify option */
  minimize: boolean;
}

export interface Type<G extends History.Group> {
  update: () => string | undefined;
  addSnapshot: (newHistory: History.Type<G>) => void;
  getHistories: (query: Query) => History.Type<G>[];
  /**
   * Using base branch reference
   */
  getLatestHistory: (query: Query) => History.Type<G> | undefined;
}

export const create = <G extends History.Group>({ filename }: InitialParams, option: Option = { minimize: true }): Type<G> => {
  const createDefaultSnapShpt = (): Snapshot.Type<G> => ({
    meta: {
      version: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    histories: [],
  });
  const getSnapshot = (filename: string): Snapshot.Type<G> => {
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

  const getHistories = (query: Query) => {
    return snapshot.histories
      .sort((a, b) => compareDate(a.meta.git.mergeDateAt, b.meta.git.mergeDateAt))
      .filter(history => {
        return history.meta.git.ref === query.git.base.ref;
      });
  };

  return {
    update: () => {
      const parentDirectory = path.dirname(filename);
      const existParentDirectory = fs.existsSync(parentDirectory) && fs.statSync(parentDirectory).isDirectory;
      if (!existParentDirectory) {
        fs.mkdirSync(parentDirectory, { recursive: true });
      }
      const text = option && option.minimize ? JSON.stringify(snapshot) : JSON.stringify(snapshot, null, 2);
      fs.writeFileSync(filename, text, { encoding: "utf-8" });
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
    getHistories,
    getLatestHistory: (query: Query) => {
      return getHistories(query).find(history => {
        return history.meta.git.ref === query.git.base.ref;
      });
    },
  };
};
