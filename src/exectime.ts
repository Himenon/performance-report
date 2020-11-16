import { EOL } from "os";
import MarkdownTable from "markdown-table";
import { createSnapshotRepository, Exectime as Target, History, Meta, findPreviousGroup, findPreviousItem } from "./tools/index";

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
  snapshot: {
    filename: string;
  };
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

export const create = ({ results, meta, snapshot }: InitialParams): Report => {
  const repository = createSnapshotRepository<Target.Group>(snapshot.filename);

  const nextGroups = results.reduce<{ [groupName: string]: Target.Group }>((all, result) => {
    return { ...all, [result.name]: generateGroup(result) };
  }, {});

  const nextHistory: History<Target.Group> = {
    meta,
    groups: nextGroups,
  };

  const previousHistory = repository.getLatestHistory(nextHistory.meta.git);

  const getGroupComparisons = (): GroupComparisons => {
    return Object.entries(nextHistory.groups).reduce<GroupComparisons>((all, [currentGroupName, currentGroup]) => {
      const comparisons = currentGroup.items.map(currentItem => {
        const previousGroup = findPreviousGroup(previousHistory, currentGroupName);
        const comparison = Target.generateComparison(previousGroup && findPreviousItem(previousGroup, currentItem), currentItem);
        return comparison;
      });
      return { ...all, [currentGroupName]: comparisons };
    }, {});
  };

  return {
    getGroupComparisons,
    getMarkdownComparisons: () => {
      const groupComparisons = getGroupComparisons();
      const section = (title: string, body: string) => {
        return [`## Exectime - ${title}`, body].join(EOL);
      };
      const sections = Object.entries(groupComparisons).map(([groupName, comparisons]) => {
        const data = [Target.markdownTableHeader].concat(comparisons.map(Target.generateMarkdownRow));
        const body = MarkdownTable(data, { align: Target.markdownTableAlign });
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
