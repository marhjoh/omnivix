export const DIAG_VARIANTS = {
  full: { label: "Full copy (control)", hero: true, rest: true, css: "" },
  "no-marquee": {
    label: "No marquee wall",
    hero: true,
    rest: true,
    css: '[class*="marqueeWall"]{display:none!important}',
  },
  "no-3d": {
    label: "Marquee without the 3D tilt",
    hero: true,
    rest: true,
    css: '[class*="marqueeWall"]{transform:translate(-50%,-50%)!important;transform-style:flat!important}',
  },
  "no-drift": {
    label: "Marquee without drifting",
    hero: true,
    rest: true,
    css: '[class*="marqueeColumn"]{animation:none!important}',
  },
  "no-glow": {
    label: "No glow behind the title",
    hero: true,
    rest: true,
    css: '[class*="heroGlow"]{display:none!important}',
  },
  "no-heading-anim": {
    label: "No heading animations",
    hero: true,
    rest: true,
    css: ".section-heading,.heading-on-load{animation:none!important}",
  },
  "hero-only": { label: "Only the hero", hero: true, rest: false, css: "" },
  "no-hero": { label: "Everything but the hero", hero: false, rest: true, css: "" },
} as const;
