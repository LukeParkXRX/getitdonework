import { describe, expect, test } from "bun:test";
import {
  hasBookableTimeRanges,
  isValidSlotRange,
  parseSlotRangeMinutes,
} from "@/lib/utils/timezone";

describe("slot range validation", () => {
  test("accepts real time ranges", () => {
    expect(isValidSlotRange("09:00-10:30")).toBe(true);
    expect(parseSlotRangeMinutes("09:00-10:30")).toEqual({ startMin: 540, endMin: 630 });
  });

  test("allows 24:00 only as the end time", () => {
    expect(isValidSlotRange("23:00-24:00")).toBe(true);
    expect(isValidSlotRange("24:00-25:00")).toBe(false);
  });

  test("rejects invalid or reversed ranges", () => {
    expect(isValidSlotRange("99:99-99:99")).toBe(false);
    expect(isValidSlotRange("10:00-09:00")).toBe(false);
    expect(isValidSlotRange("10:00-10:00")).toBe(false);
    expect(isValidSlotRange("9:00-10:00")).toBe(false);
  });
});

describe("hasBookableTimeRanges", () => {
  test("requires at least one enabled real slot", () => {
    expect(
      hasBookableTimeRanges({
        weekly: {
          mon: { enabled: true, slots: ["09:00-10:00"] },
        },
      }),
    ).toBe(true);
  });

  test("does not treat empty saved availability as complete", () => {
    expect(
      hasBookableTimeRanges({
        weekly: {
          mon: { enabled: true, slots: [] },
          tue: { enabled: false, slots: ["09:00-10:00"] },
        },
      }),
    ).toBe(false);
  });
});
