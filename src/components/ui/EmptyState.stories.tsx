import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const InboxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const WithAction: Story = {
  args: {
    icon: <SearchIcon />,
    title: "검색 결과가 없습니다",
    description: "다른 키워드로 검색하거나 필터를 변경해 보세요.",
    action: { label: "전체 보기", href: "/enablers" },
  },
};

export const WithoutAction: Story = {
  args: {
    icon: <InboxIcon />,
    title: "아직 세션이 없습니다",
    description: "첫 번째 세션을 예약해보세요.",
  },
};

export const NoIcon: Story = {
  args: {
    title: "데이터가 없습니다",
    description: "잠시 후 다시 시도해주세요.",
    action: { label: "새로고침", onClick: () => window.location.reload() },
  },
};

export const MinimalTitle: Story = {
  args: {
    title: "등록된 항목이 없습니다",
  },
};
