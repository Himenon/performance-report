import * as Git from "./git";
import * as Exectime from "./exectime";
import * as Filesize from "./filesize";

export type Item = Filesize.Item | Exectime.Item;
export type Group = Filesize.Group | Exectime.Group;

export interface Type<G extends Group> {
  meta: {
    git: Git.Meta;
  };
  groups: {
    [groupName: string]: G;
  };
}
