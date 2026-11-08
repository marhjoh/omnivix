import { NextResponse } from "next/server";
import { iconCatalog } from "@/src/icons/simpleIcons";

// Built once with the app, since it only changes with the simple-icons package.
export const dynamic = "force-static";

/** Every Simple Icons icon without its path, for the studio's icon search. */
export function GET() {
  return NextResponse.json(iconCatalog());
}
