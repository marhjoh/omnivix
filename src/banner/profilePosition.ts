import { oneOfOr } from "@/src/lib/isOneOf";

/** Which side of the content the avatar and name sit on (GitHub and repos banners). */
export const PROFILE_POSITIONS = ["left", "right"] as const;

export type ProfilePosition = (typeof PROFILE_POSITIONS)[number];

export const PROFILE_POSITION_OPTIONS = PROFILE_POSITIONS.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));

/** Left unless the setting is a valid position. */
export function profilePositionOf(raw: unknown): ProfilePosition {
  return oneOfOr(PROFILE_POSITIONS, raw, "left");
}
