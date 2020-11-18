import { EOL } from "os";
import MarkdownTable from "markdown-table";
import { Git, Exectime as Target, History, Query } from "./tools";
import * as Repository from "./repository";
import * as Calculator from "./calculator";

export { Repository, Git };

export interface Measurement {
  [name: string]: {
    startDateUnixTimeMs: number;
    durationMs: number;
  };
}

export interface Group {
  name: string;
  description?: string;
  measurement: Measurement;
}

export interface InitialParams {
  snapshot: Repository.InitialParams;
  meta: {
    git: Git.Meta;
  };
  groups: Group[];
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

const generateGroup = (result: Group): Target.Group => {
  return {
    name: result.name,
    description: result.description,
    items: generateItems(result.measurement),
  };
};

export interface Option {
  snapshot?: Repository.Option;
  exectime?: {
    averageList: Array<number | "all">;
  };
}

export const create = ({ groups, meta, snapshot }: InitialParams, option: Option): Report => {
  const repository = Repository.create<Target.Group>(snapshot, option.snapshot);
  const averageList = option.exectime ? option.exectime.averageList : [];

  const nextGroups = groups.reduce<{ [groupName: string]: Target.Group }>((all, result) => {
    return { ...all, [result.name]: generateGroup(result) };
  }, {});

  const nextHistory: History.Type<Target.Group> = {
    meta,
    groups: nextGroups,
  };

  const previousHistory = repository.getLatestHistory(snapshot.query);

  const getGroupComparisons = (compareTargetHistory: History.Type<Target.Group> | undefined): GroupComparisons => {
    return Object.entries(nextHistory.groups).reduce<GroupComparisons>((all, [currentGroupName, currentGroup]) => {
      const previousGroup = Query.findPreviousGroup(compareTargetHistory, currentGroupName);
      const comparisons = currentGroup.items.map(currentItem => {
        const comparison = Target.generateComparison(previousGroup && Query.findPreviousItem(previousGroup, currentItem), currentItem);
        return comparison;
      });
      return { ...all, [currentGroupName]: comparisons };
    }, {});
  };

  /**
   * 複数のパターンで平均化されたデータ情報を取得する
   */
  const averageGroupComparisons = (() => {
    if (!option.exectime) {
      return [];
    }
    const histories = repository.getHistories(snapshot.query);
    return option.exectime.averageList.map(count => {
      return getGroupComparisons(previousHistory && Calculator.Average.calculate(previousHistory, histories, count));
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
