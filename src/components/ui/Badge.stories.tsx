import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "warning", "error", "info", "accent", "neutral"],
    },
    size: { control: "select", options: ["sm", "md"] },
    dot: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Verified: Story = {
  args: { variant: "success", dot: true, children: "Verified" },
};

export const TopRated: Story = {
  args: { variant: "accent", dot: false, children: "Top Rated" },
};

export const RisingStar: Story = {
  args: { variant: "info", dot: true, children: "Rising Star" },
};

export const Warning: Story = {
  args: { variant: "warning", dot: true, children: "Pending" },
};

export const Error: Story = {
  args: { variant: "error", dot: false, children: "Rejected" },
};

export const Neutral: Story = {
  args: { variant: "neutral", dot: false, children: "Draft" },
};

export const Small: Story = {
  args: { variant: "success", size: "sm", dot: true, children: "Active" },
};
