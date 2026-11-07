import { redirect } from "next/navigation";

// Temporary on the diag branch: any preview link lands on the list of test pages.
export default function Home() {
  redirect("/diag");
}
