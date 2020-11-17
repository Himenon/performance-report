import { EOL } from "os";
import MarkdownTable from "markdown-table";
import {
  createSnapshotRepository,
  Exectime as Target,
  History,
  Meta,
  findPreviousGroup,
  findPreviousItem,
  Query,
  Option as SnapshotOption,
  InitialParams as SnapshotInitialParams,
} from "./tools/index";

export interface Measurement {
  [name: string]: {
    startDateUnixTimeMs: number;
    durationMs: number;
  };
}

export interface Result {
  name: string;
  description?: string;
  measurement: Measurement;
}

export interface InitialParams {
  snapshot: SnapshotInitialParams;
  query: Query;
  meta: {
    git: Meta.Git;
  };
  results: Result[];
}

export type GroupComparisons = { [groupName: string]: Target.Comparison[] };

export interface Report {
  getGroupComparisons: () => GroupComparisons;
  getMarkdownComparisons: () => string;
  update: () => string | undefined;
}

const generateItems = (measurement: Measurement): Target.Item[] => {
  return Object.entries(measurement).map(([name, item]) => {
    return {
      name,
      startDateUnixTimeMs: item.startDateUnixTimeMs,
      durationMs: item.durationMs,
    };
  });
};

const generateGroup = (result: Result): Target.Group => {
  return {
    name: result.name,
    description: result.description,
    items: generateItems(result.measurement),
  };
};

export interface Option {
  snapshot?: SnapshotOption;
  exectime?: {
    averageList: Array<number | "all">;
  };
}

export const create = ({ results, meta, snapshot, query }: InitialParams, option: Option): Report => {
  const repository = createSnapshotRepository<Target.Group>(snapshot, option.snapshot);
  const averageList = option.exectime ? option.exectime.averageList : [];

  const nextGroups = results.reduce<{ [groupName: string]: Target.Group }>((all, result) => {
    return { ...all, [result.name]: generateGroup(result) };
  }, {});

  const nextHistory: History<Target.Group> = {
    meta,
    groups: nextGroups,
  };

  const previousHistory = repository.getLatestHistory(query);

  const getGroupComparisons = (compareTargetHistory: History<Target.Group> | undefined): GroupComparisons => {
    return Object.entries(nextHistory.groups).reduce<GroupComparisons>((all, [currentGroupName, currentGroup]) => {
      const previousGroup = findPreviousGroup(compareTargetHistory, currentGroupName);
      const comparisons = currentGroup.items.map(currentItem => {
        const comparison = Target.generateComparison(previousGroup && findPreviousItem(previousGroup, currentItem), currentItem);
        return comparison;
      });
      return { ...all, [currentGroupName]: comparisons };
    }, {});
  };

  /**
   * 平均が算出されたHistoryデータを作成する
   * TODO 分割
   */
  const generateAverage = (count: number | "all"): History<Target.Group> | undefined => {
    if (!previousHistory) {
      return undefined;
    }
    const targetHistoryGroup: History<Target.Group> = JSON.parse(JSON.stringify(previousHistory));
    let total = 1;
    const histories = repository.getHistories(query);
    const allCount = count === "all" ? histories.length : count;
    console.log(JSON.stringify(histories, null, 2));
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

  /**
   * 複数のパターンで平均化されたデータ情報を取得する
   */
  const averageGroupComparisons = (() => {
    if (!option.exectime) {
      return [];
    }
    return option.exectime.averageList.map(count => {
      return getGroupComparisons(generateAverage(count));
    });
  })();

  return {
    getGroupComparisons: () => getGroupComparisons(previousHistory),
    getMarkdownComparisons: () => {
      const groupComparisons = getGroupComparisons(previousHistory);
      const section = (title: string, body: string) => {
        return [`## Exectime - ${title}`, body].join(EOL);
      };
      const sections = Object.entries(groupComparisons).map(([groupName, comparisons]) => {
        const data = comparisons.map(comparison => {
          // あるグループに属する、あるコマンドの平均Comparisonを取得する
          const averageDiff = averageGroupComparisons.map((ave, idx) => {
            const c = ave[groupName].find(item => item.execCommandName === comparison.execCommandName);
            if (!c) {
              return;
            }
            return { ...c, averageTimes: averageList[idx] };
          });
          return Target.generateMarkdownRow(comparison, { averageDiff });
        });
        let header = Target.markdownTableHeader;
        let markdownTableAlign = Target.markdownTableAlign;
        for (let i = 0; i < averageList.length; i++) {
          markdownTableAlign = markdownTableAlign.concat("r");
          header = header.concat([`Ave **${averageList[i]}** time`, `Ave **${averageList[i]}** diff`]);
        }
        const body = MarkdownTable([header].concat(data), { align: Target.markdownTableAlign });
        return section(groupName, body);
      });
      return sections.join(EOL);
    },
    update: () => {
      repository.addSnapshot(nextHistory);
      return repository.update();
    },
  };
};
