import { Exectime as Target, History } from "../tools";
import { getGroupComparisons } from "../exectime";

const groupName = "@himenon/performance-report";

const a: History.Type<Target.Group> = {
  groups: {
    [groupName]: {
      description: "self repository performance report.",
      items: [
        {
          durationMs: 1000,
          name: "yarn:test",
          startDateUnixTimeMs: 1605619178380.5,
        },
        {
          durationMs: 2000,
          name: "yarn:build",
          startDateUnixTimeMs: 1605619180232.5,
        },
      ],
      name: groupName,
    },
  },
  meta: {
    git: {
      owner: "Himenon",
      ref: "main",
      repoName: "performance-report",
      sha: "3a857376ee502c5e069712a06cc188ec6bf309b8",
    },
  },
};

const b: History.Type<Target.Group> = {
  groups: {
    [groupName]: {
      description: "self repository performance report.",
      items: [
        {
          durationMs: 1100,
          name: "yarn:test",
          startDateUnixTimeMs: 1605605089261,
        },
        {
          durationMs: 3000,
          name: "yarn:build",
          startDateUnixTimeMs: 1605605093641,
        },
      ],
      name: groupName,
    },
  },
  meta: {
    git: {
      owner: "Himenon",
      ref: "main",
      repoName: "performance-report",
      sha: "a3a65e7f5fd02071fb00463b75a2f0461deac8e8",
    },
  },
};

describe("exectime.tsのテスト", () => {
  it("getGroupComparisonsの試験", () => {
    const result = getGroupComparisons(a, b);
    result[groupName][0].currentExecuteDurationMs;

    for (let idx = 0; idx < a.groups[groupName].items.length; idx++) {
      const prevItem = a.groups[groupName].items[idx];
      const currentItem = b.groups[groupName].items[idx];
      expect(result[groupName][idx].prevExecuteDurationMs).toEqual(prevItem.durationMs);
      expect(result[groupName][idx].currentExecuteDurationMs).toEqual(currentItem.durationMs);
      const diff = ((currentItem.durationMs - prevItem.durationMs) / prevItem.durationMs) * 100;
      expect(result[groupName][idx].execCommandDurationDiff).toEqual(diff);
    }
  });
});
