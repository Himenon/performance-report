import { calculate, Target, History } from "../average";
import * as DataSet from "./dataSet";

describe("平均値の計算のテスト", () => {
  const getItem = (query: { groupName: string; itemName: string }, history: History.Type<Target.Group>): Target.Item | undefined => {
    const group = history.groups[query.groupName];
    if (!group) {
      return;
    }
    return group.items.find(item => item.name === query.itemName);
  };
  it("2 times", () => {
    const times = 2;
    const averageHistory = calculate(DataSet.baseHistory, DataSet.histories_2, times);
    if (!averageHistory) {
      expect(averageHistory).toBeTruthy();
      return;
    }
    const item1_1 = getItem({ groupName: DataSet.groupName, itemName: DataSet.itemName1 }, averageHistory);
    if (!item1_1) {
      expect(item1_1).toBeTruthy();
      return;
    }
    expect(item1_1.durationMs).toEqual((DataSet.item1_1.durationMs + DataSet.item1_2.durationMs) / times);
    expect(item1_1.startDateUnixTimeMs).toEqual((DataSet.item1_1.startDateUnixTimeMs + DataSet.item1_2.startDateUnixTimeMs) / times);

    const item1_2 = getItem({ groupName: DataSet.groupName, itemName: DataSet.itemName2 }, averageHistory);
    if (!item1_2) {
      expect(item1_2).toBeTruthy();
      return;
    }
    expect(item1_2.durationMs).toEqual((DataSet.item2_1.durationMs + DataSet.item2_2.durationMs) / times);
    expect(item1_2.startDateUnixTimeMs).toEqual((DataSet.item2_1.startDateUnixTimeMs + DataSet.item2_2.startDateUnixTimeMs) / times);
  });

  it("3 times", () => {
    const times = 3;
    const averageHistory = calculate(DataSet.baseHistory, DataSet.histories_3, 3);
    if (!averageHistory) {
      expect(averageHistory).toBeTruthy();
      return;
    }
    const item1 = getItem({ groupName: DataSet.groupName, itemName: DataSet.itemName1 }, averageHistory);
    if (!item1) {
      expect(item1).toBeTruthy();
      return;
    }
    expect(item1.durationMs).toEqual((DataSet.item1_1.durationMs + DataSet.item1_2.durationMs + DataSet.item1_3.durationMs) / times);
    expect(item1.startDateUnixTimeMs).toEqual(
      (DataSet.item1_1.startDateUnixTimeMs + DataSet.item1_2.startDateUnixTimeMs + DataSet.item1_3.startDateUnixTimeMs) / times,
    );

    const item1_2 = getItem({ groupName: DataSet.groupName, itemName: DataSet.itemName2 }, averageHistory);
    if (!item1_2) {
      expect(item1_2).toBeTruthy();
      return;
    }
    expect(item1_2.durationMs).toEqual((DataSet.item2_1.durationMs + DataSet.item2_2.durationMs + DataSet.item2_3.durationMs) / times);
    expect(item1_2.startDateUnixTimeMs).toEqual(
      (DataSet.item2_1.startDateUnixTimeMs + DataSet.item2_2.startDateUnixTimeMs + DataSet.item2_3.startDateUnixTimeMs) / times,
    );
  });
});
