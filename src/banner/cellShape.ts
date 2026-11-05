/** The contribution grid's cell shape (GitHub and contribution banners). */
export const CONTRIBUTION_CELL_SHAPES = ["rounded", "square", "circle"] as const;

export type ContributionCellShape = (typeof CONTRIBUTION_CELL_SHAPES)[number];

export const DEFAULT_CELL_SHAPE: ContributionCellShape = "rounded";

export const CONTRIBUTION_CELL_SHAPE_OPTIONS = CONTRIBUTION_CELL_SHAPES.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));
