import type { Meta, StoryObj } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import EnablerCard from "./EnablerCard";

const messages = {
  FeaturedEnablers: {
    sectionLabel: "Featured Enablers",
    sectionTitle: "Meet Verified Enablers",
    viewAll: "View All →",
    creditRate: "{credits} Credits / Session",
    statNew: "New",
    statSessions: "Sessions",
    statRating: "Rating",
    bookNow: "Book Now",
  },
};

const withIntl = (Story: React.ComponentType) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <Story />
  </NextIntlClientProvider>
);

const baseEnabler = {
  userId: "user-1",
  university: "Seoul National University",
  degreeType: "MBA",
  specialties: ["Go-to-Market", "Sales Strategy", "Fundraising"],
  location: "Seoul, Korea",
  bio: "Former BCG consultant with 8 years of experience helping startups expand globally.",
  creditRate: 5,
  enablerScore: 92,
  badgeLevel: "top_rated" as const,
  status: "approved" as const,
  sessionCount: 87,
  rating: 4.8,
  reRequestRate: 0.91,
  availability: {},
  fullName: "Luke Kim",
  avatarInitial: "L",
  avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=LK&backgroundColor=4ade80",
};

const meta: Meta<typeof EnablerCard> = {
  title: "Enabler/EnablerCard",
  component: EnablerCard,
  decorators: [withIntl],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EnablerCard>;

export const TopRated: Story = {
  args: {
    enabler: baseEnabler,
    delay: 0,
  },
};

export const Verified: Story = {
  args: {
    enabler: {
      ...baseEnabler,
      badgeLevel: "verified",
      rating: 4.2,
      sessionCount: 23,
      fullName: "Jane Park",
      avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=JP&backgroundColor=60a5fa",
    },
    delay: 0,
  },
};

export const RisingStar: Story = {
  args: {
    enabler: {
      ...baseEnabler,
      badgeLevel: "rising_star",
      rating: 0,
      sessionCount: 0,
      fullName: "Chris Lee",
      avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=CL&backgroundColor=f59e0b",
    },
    delay: 0,
  },
};

export const NewNoRating: Story = {
  args: {
    enabler: {
      ...baseEnabler,
      rating: 0,
      sessionCount: 0,
      badgeLevel: "verified",
      fullName: "New Enabler",
      avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=NE&backgroundColor=a78bfa",
    },
    delay: 0,
  },
};
