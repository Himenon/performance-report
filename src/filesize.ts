import { EOL } from "os";
import MarkdownTable from "markdown-table";
import { createSnapshotRepository, Filesize as Target, History, Meta, findPreviousGroup, findPreviousItem, Query } from "./tools";

export interface Package {
  name: string;
  version: string;
  items: {
    [name: string]: {
      absolutePath: string;
    };
  };
}

export interface InitialParams {
  snapshot: {
    filename: string;
  };
  query: Query;
  meta: {
    git: Meta.Git;
  };
  packages: Package[];
}

export type GroupComparisons = { [groupName: string]: Target.Comparison[] };

export interface Report {
  getGroupComparisons: () => GroupComparisons;
  getMarkdownComparisons: () => string;
  update: () => string | undefined;
}

const generateGroup = (pkg: Package): Target.Group => {
  const items: Target.Item[] = Object.entries(pkg.items).map(([name, item]) => {
    const profile = Target.generateProfile(item.absolutePath);
    return {
      name,
      path: item.absolutePath,
      sizeByte: profile.sizeByte,
      gzipSizeByte: profile.gzipSizeByte,
    };
  });
  return {
    name: pkg.name,
    version: pkg.version,
    items,
  };
};

export const TableHeader: string[] = ["**File**", "**Filesize Diff**", "**Current Size**", "**Prev Size**", "**ENV**", "compare"];

export const create = ({ packages, meta, snapshot, query }: InitialParams): Report => {
  const repository = createSnapshotRepository<Target.Group>(snapshot.filename);

  const nextGroups = packages.reduce<{ [groupName: string]: Target.Group }>((all, pkg) => {
    return { ...all, [pkg.name]: generateGroup(pkg) };
  }, {});

  const nextHistory: History<Target.Group> = {
    meta,
    groups: nextGroups,
  };

  const previousHistory = repository.getLatestHistory(query);

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
        return [`## Filesize - ${title}`, body].join(EOL);
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
