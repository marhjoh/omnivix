import { Coffee } from "lucide-react";
import { SITE_LINKS } from "@/src/lib/site";
import { GithubIcon } from "@/src/ui/GithubIcon";

/** The support and repository links, in the landing page's header and footer. */
export const SITE_NAV_LINKS = [
  {
    id: "coffee",
    href: SITE_LINKS.buyMeACoffee,
    label: "Buy me a coffee",
    icon: <Coffee className="h-[18px] w-[18px] shrink-0" aria-hidden />,
  },
  {
    id: "github",
    href: SITE_LINKS.repo,
    label: "GitHub",
    icon: <GithubIcon />,
  },
] as const;
