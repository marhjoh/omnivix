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
      <h2 className="pt-4 text-lg font-semibold">Round 3: speed</h2>
      <ul className="space-y-3">
        <li>
          <a className="text-accent underline" href="/diag/dynamic">
            Rendered on request
          </a>
        </li>
        <li>
          <a className="text-accent underline" href="/diag/slow">
            Slow (0.8 s)
          </a>
        </li>
        <li>
          <a className="text-accent underline" href="/diag/notfound-static">
            404 content, pre-built
          </a>
        </li>
      </ul>
    </main>
  );
}
