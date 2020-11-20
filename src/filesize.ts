import * as path from "path";
import { EOL } from "os";
import MarkdownTable from "markdown-table";
import { Git, Filesize as Target, History, Query } from "./tools";
import * as MarkdownUtil from "./tools/markdown";
import * as Repository from "./repository";

export { Repository, Git };

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
  snapshot: Repository.InitialParams;
  meta: {
    git: Git.Meta;
  };
  groups: Group[];
}

export type GroupComparisons = { [groupName: string]: Target.Comparison[] };

export interface MarkdownComparisonOption {
  previous: {
    git: {
      sha: string;
    };
  };
  current: {
    git: {
      sha: string;
    };
  };
}

export interface Report {
  getGroupComparisons: () => GroupComparisons;
  getMarkdownComparisons: (gitHubBaseUrl: string) => string;
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
  snapshot?: Repository.Option;
  filesize?: GroupOption;
}

export const create = ({ groups, meta, snapshot }: InitialParams, option: Option): Report => {
  const repository = Repository.create<Target.Group>(snapshot, option.snapshot);

  const nextGroups = groups.reduce<{ [groupName: string]: Target.Group }>((all, pkg) => {
    return { ...all, [pkg.name]: generateGroup(pkg, option.filesize) };
  }, {});

  const nextHistory: History.Type<Target.Group> = {
    meta,
    groups: nextGroups,
  };

  const previousHistory = repository.getLatestHistory(snapshot.query);

  const getGroupComparisons = (): GroupComparisons => {
    return Object.entries(nextHistory.groups).reduce<GroupComparisons>((all, [currentGroupName, currentGroup]) => {
      const comparisons = currentGroup.items.map(currentItem => {
        const previousGroup = Query.findPreviousGroup(previousHistory, currentGroupName);
        const comparison = Target.generateComparison(previousGroup && Query.findPreviousItem(previousGroup, currentItem), currentItem);
        return comparison;
      });
      return { ...all, [currentGroupName]: comparisons };
    }, {});
  };

  return {
    getGroupComparisons,
    getMarkdownComparisons: gitHubBaseUrl => {
      const repositoryUrl = MarkdownUtil.generateRepositoryUrl({ baseUrl: gitHubBaseUrl, owner: meta.git.owner, repo: meta.git.repoName });
      const compareUrl =
        previousHistory &&
        MarkdownUtil.generateCompareUrl({
          repositoryUrl,
          baseSha: previousHistory.meta.git.sha,
          headSha: nextHistory.meta.git.sha,
        });
      const groupComparisons = getGroupComparisons();
      const section = (title: string, body: string) => {
        return [`## Filesize - ${title}`, compareUrl && `<${compareUrl}>`, body].filter(Boolean).join(EOL + EOL);
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
