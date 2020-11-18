import * as Exectime from "./exectime";
import * as Filesize from "./filesize";
import * as History from "./history";

export interface GroupComparisons<Comparison extends Exectime.Comparison | Filesize.Comparison> {
  [groupName: string]: Comparison[];
}

export const findPreviousGroup = <G extends History.Group>(history: History.Type<G> | undefined, groupName: string): G | undefined => {
  return history && history.groups[groupName];
};

export interface FindPreviousItem {
  (previousGroup: Filesize.Group, currentItem: Filesize.Item): Filesize.Item | undefined;
  (previousGroup: Exectime.Group, currentItem: Exectime.Item): Exectime.Item | undefined;
}

export const findPreviousItem: FindPreviousItem = (previousGroup: any, currentItem: History.Item) => {
  return previousGroup && previousGroup.items.find((item: History.Item) => currentItem.name === item.name);
};
