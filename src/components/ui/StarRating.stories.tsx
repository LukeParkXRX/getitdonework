import type { Meta, StoryObj } from "@storybook/react";
import { StarRating } from "./StarRating";

const meta: Meta<typeof StarRating> = {
  title: "UI/StarRating",
  component: StarRating,
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "range", min: 0, max: 5, step: 0.5 } },
    max: { control: { type: "number", min: 1, max: 10 } },
    size: { control: { type: "range", min: 12, max: 32, step: 2 } },
    interactive: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof StarRating>;

export const Full: Story = {
  args: { value: 5, max: 5, size: 18 },
};

export const High: Story = {
  args: { value: 4.8, max: 5, size: 18 },
};

export const Mid: Story = {
  args: { value: 3, max: 5, size: 18 },
};

export const Zero: Story = {
  args: { value: 0, max: 5, size: 18 },
};

export const Interactive: Story = {
  args: { value: 3, max: 5, interactive: true, size: 24 },
};

export const Large: Story = {
  args: { value: 4, max: 5, size: 28 },
};
