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
    revList?: string[];
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

  const snapshot = getSnapshot(filename);

  const sortWithKeys = (sortKeys: string[]) => (a: string, b: string) => {
    return sortKeys.indexOf(a) - sortKeys.indexOf(b);
  };

  const hasSameSHA = (sha: string): boolean => {
    return !!snapshot.histories.find(history => history.meta.git.sha === sha);
  };

  const getHistories = (query: Query) => {
    const sortHistoryByRevList = sortWithKeys(query.git.revList || []);
    return snapshot.histories
      .sort((a, b) => sortHistoryByRevList(a.meta.git.sha, b.meta.git.sha))
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
