import { connection } from "next/server";
import DiagPage from "../[variant]/page";

// Temporary: the full copy, answered after 0.8 s.
export default async function SlowDiag() {
  await connection();
  await new Promise((resolve) => setTimeout(resolve, 800));
  return <DiagPage params={Promise.resolve({ variant: "full" })} />;
}
