import { describe, expect, it } from "bun:test";
import {
  getPublicEnablerProfileIssues,
  isPublicEnablerProfileComplete,
} from "../public-profile";

const completeProfile = {
  fullName: "Woosub Lee",
  university: "University of Maryland",
  degreeType: "MBA",
  location: "Greater Washington DC Area",
  bio: "I help startups validate US market entry, fundraising strategy, and execution plans.",
  specialties: ["Startup Investment", "US Market Entry"],
};

describe("public enabler profile completeness", () => {
  it("accepts profiles with the fields needed for public launch", () => {
    expect(isPublicEnablerProfileComplete(completeProfile)).toBe(true);
    expect(getPublicEnablerProfileIssues(completeProfile)).toEqual([]);
  });

  it("rejects placeholder profile values", () => {
    expect(
      getPublicEnablerProfileIssues({
        ...completeProfile,
        university: "TEST",
        specialties: ["placeholder"],
      })
    ).toEqual(["university", "specialties"]);
  });

  it("rejects profiles with missing public card fields", () => {
    expect(
      getPublicEnablerProfileIssues({
        ...completeProfile,
        location: "",
        bio: "short",
        specialties: [],
      })
    ).toEqual(["location", "bio", "specialties"]);
  });
});
