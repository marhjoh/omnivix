import {
  siBluesky,
  siBuymeacoffee,
  siDiscord,
  siKofi,
  siMastodon,
  siPatreon,
  siTwitch,
  siX,
  type SimpleIcon,
} from "simple-icons";
import type { PlatformIconName } from "@/src/lib/sizes";

// LinkedIn isn't in simple-icons (removed at LinkedIn's request), so it stays a text mark.
const ICONS: Record<Exclude<PlatformIconName, "linkedin">, SimpleIcon> = {
  x: siX,
  bluesky: siBluesky,
  mastodon: siMastodon,
  kofi: siKofi,
  buymeacoffee: siBuymeacoffee,
  twitch: siTwitch,
  patreon: siPatreon,
  discord: siDiscord,
};

/** Monochrome brand mark in `currentColor`. */
export function PlatformIcon({ icon, size = 12 }: { icon: PlatformIconName; size?: number }) {
  if (icon === "linkedin") {
    return (
      <span
        aria-hidden
        style={{ fontSize: size * 0.9, lineHeight: `${size}px`, width: size }}
        className="inline-block text-center font-bold"
      >
        in
      </span>
    );
  }
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d={ICONS[icon].path} />
    </svg>
  );
}
