import * as History from "./history";

export interface Meta {
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface Type<G extends History.Group> {
  meta: Meta;
  histories: History.Type<G>[];
}
