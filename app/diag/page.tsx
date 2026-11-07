import Link from "next/link";
import { DIAG_VARIANTS } from "./variants";

// Temporary index for testing on a phone. Plain links, so each opens as a fresh page load.
export default function DiagIndex() {
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Pull-to-refresh test</h1>
      <p className="text-muted">Open each, pull down to reload, and note which ones jerk.</p>
      <ul className="space-y-3">
        {Object.entries(DIAG_VARIANTS).map(([id, { label }]) => (
          <li key={id}>
            <a className="text-accent underline" href={`/diag/${id}`}>
              {label}
            </a>
          </li>
        ))}
      </ul>
      <Link className="text-muted underline" href="/">
        Real landing page
      </Link>
    </main>
  );
}
