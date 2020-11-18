/**
 * Item方向にスケールした場合のデータセット
 */
import { Target, History } from "../average";

export const itemName1 = "command1";
export const itemName2 = "command2";
export const groupName = "group1";

export const item1_1: Target.Item = {
  name: itemName1,
  startDateUnixTimeMs: 10,
  durationMs: 20,
};

export const item1_2: Target.Item = {
  name: itemName1,
  startDateUnixTimeMs: 20,
  durationMs: 40,
};

export const item1_3: Target.Item = {
  name: itemName1,
  startDateUnixTimeMs: 30,
  durationMs: 60,
};

export const item2_1: Target.Item = {
  name: itemName2,
  startDateUnixTimeMs: 100,
  durationMs: 200,
};

export const item2_2: Target.Item = {
  name: itemName2,
  startDateUnixTimeMs: 200,
  durationMs: 400,
};

export const item2_3: Target.Item = {
  name: itemName2,
  startDateUnixTimeMs: 300,
  durationMs: 600,
};

export const group1: Target.Group = {
  name: groupName,
  items: [item1_1, item2_1],
};

export const group2: Target.Group = {
  name: groupName,
  items: [item1_2, item2_2],
};

export const group3: Target.Group = {
  name: groupName,
  items: [item1_3, item2_3],
};

const generateHistory = ({ sha, groups }: { sha: string; groups: Target.Group[] }): History.Type<Target.Group> => {
  return {
    meta: {
      git: {
        ref: "main",
        owner: "Himenon",
        repoName: "performance-report",
        sha,
      },
    },
    groups: groups.reduce((all, g) => ({ ...all, [g.name]: g }), {}),
  };
};

export const baseHistory: History.Type<Target.Group> = generateHistory({ sha: "1", groups: [group1] });
export const histories_2: History.Type<Target.Group>[] = [baseHistory, generateHistory({ sha: "2", groups: [group2] })];
export const histories_3: History.Type<Target.Group>[] = [
  baseHistory,
  generateHistory({ sha: "2", groups: [group2] }),
  generateHistory({ sha: "3", groups: [group3] }),
];
