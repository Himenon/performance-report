import { Exectime as Target, History } from "../tools";

export { Target, History };

/**
 * 平均が算出されたHistoryデータを作成する
 */
export const calculate = <G extends Target.Group>(
  baseHistory: History.Type<G>,
  histories: History.Type<G>[],
  count: number | "all",
): History.Type<G> | undefined => {
  const targetHistoryGroup: History.Type<G> = JSON.parse(JSON.stringify(baseHistory));
  let total = 1;
  const allCount = count === "all" ? histories.length : count;
  histories.forEach(history => {
    if (total === allCount) {
      return;
    }
    if (history.meta.git.sha === targetHistoryGroup.meta.git.sha) {
      return;
    }
    Object.entries(history.groups).forEach(([groupName, group]) => {
      const targetGroup = targetHistoryGroup.groups[groupName];
      group.items.forEach(item => {
        const targetItem = targetGroup.items.find(targetItem => targetItem.name == item.name);
        if (targetItem) {
          targetItem.durationMs += item.durationMs;
          targetItem.startDateUnixTimeMs += item.startDateUnixTimeMs;
        }
      });
    });
    total += 1;
  });
  Object.keys(targetHistoryGroup.groups).forEach(groupName => {
    for (let index = 0; index < targetHistoryGroup.groups[groupName].items.length; index++) {
      targetHistoryGroup.groups[groupName].items[index].durationMs /= allCount;
      targetHistoryGroup.groups[groupName].items[index].startDateUnixTimeMs /= allCount;
    }
  });
  return targetHistoryGroup;
};
