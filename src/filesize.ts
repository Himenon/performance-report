import * as path from "path";
import { EOL } from "os";
import MarkdownTable from "markdown-table";
import {
  createSnapshotRepository,
  Filesize as Target,
  History,
  Meta,
  findPreviousGroup,
  findPreviousItem,
  Query,
  Option as SnapshotOption,
  InitialParams as SnapshotInitialParams,
} from "./tools";

export interface Group {
  name: string;
  version: string;
  description?: string;
  items: {
    [name: string]: {
      absolutePath: string;
    };
  };
}

export interface InitialParams {
  snapshot: SnapshotInitialParams;
  query: Query;
  meta: {
    git: Meta.Git;
  };
  groups: Group[];
}

export type GroupComparisons = { [groupName: string]: Target.Comparison[] };

export interface Report {
  getGroupComparisons: () => GroupComparisons;
  getMarkdownComparisons: () => string;
  update: () => string | undefined;
}

export interface GroupOption {
  applicationRoot?: string;
}

const generateGroup = (group: Group, option: GroupOption = {}): Target.Group => {
  const items: Target.Item[] = Object.entries(group.items).map(([name, item]) => {
    const profile = Target.generateProfile(item.absolutePath);
    return {
      name,
      path: option.applicationRoot ? path.relative(option.applicationRoot, item.absolutePath) : item.absolutePath,
      sizeByte: profile.sizeByte,
      gzipSizeByte: profile.gzipSizeByte,
    };
  });
  return {
    name: group.name,
    description: group.description,
    version: group.version,
    items,
  };
};

export const TableHeader: string[] = ["**File**", "**Filesize Diff**", "**Current Size**", "**Prev Size**", "**ENV**", "compare"];

export interface Option {
  snapshot?: SnapshotOption;
  filesize?: GroupOption;
}

export const create = ({ groups: packages, meta, snapshot, query }: InitialParams, option: Option): Report => {
  const repository = createSnapshotRepository<Target.Group>(snapshot, option.snapshot);

  const nextGroups = packages.reduce<{ [groupName: string]: Target.Group }>((all, pkg) => {
    return { ...all, [pkg.name]: generateGroup(pkg, option.filesize) };
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
