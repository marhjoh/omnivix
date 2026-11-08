/** Which side of the content the avatar and name sit on (GitHub, repos and stats banners). */
export const PROFILE_POSITIONS = ["left", "right"] as const;

export const PROFILE_POSITION_OPTIONS = PROFILE_POSITIONS.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));
