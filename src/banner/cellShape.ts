import { oneOfOr } from "@/src/lib/isOneOf";

/** The contribution grid's cell shape (GitHub and contribution banners). */
export const CONTRIBUTION_CELL_SHAPES = ["rounded", "square", "circle"] as const;

export type ContributionCellShape = (typeof CONTRIBUTION_CELL_SHAPES)[number];

export const DEFAULT_CELL_SHAPE: ContributionCellShape = "rounded";

const CONTRIBUTION_CELL_SHAPE_LABELS: Record<ContributionCellShape, string> = {
  rounded: "Rounded",
  square: "Square",
  circle: "Circle",
};

export const CONTRIBUTION_CELL_SHAPE_OPTIONS: Array<{
  label: string;
  value: ContributionCellShape;
}> = CONTRIBUTION_CELL_SHAPES.map((value) => ({
  label: CONTRIBUTION_CELL_SHAPE_LABELS[value],
  value,
}));

export function contributionCellShapeFromState(raw: unknown): ContributionCellShape {
  return oneOfOr(CONTRIBUTION_CELL_SHAPES, raw, DEFAULT_CELL_SHAPE);
}
