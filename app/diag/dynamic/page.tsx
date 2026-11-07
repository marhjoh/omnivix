import { connection } from "next/server";
import DiagPage from "../[variant]/page";

// Temporary: the full copy, rendered on each request like the 404 page.
export default async function DynamicDiag() {
  await connection();
  return <DiagPage params={Promise.resolve({ variant: "full" })} />;
}
