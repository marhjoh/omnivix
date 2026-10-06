import Link from "next/link";
import { ArrowLeft, Download, Loader2, User, X } from "lucide-react";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { ThemedIcon } from "@/src/theme/ThemedBrand";

export function TopBar({
  title,
  onDownload,
  isDownloading,
  blockedReason,
  exportError,
  onDismissExportError,
  username,
  needsUsername,
  onChangeUsername,
}: {
  title: string;
  onDownload: () => void;
  isDownloading: boolean;
  blockedReason: string | null;
  exportError: string | null;
  onDismissExportError: () => void;
  username?: string;
  needsUsername?: boolean;
  onChangeUsername?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/" className="btn-ghost rounded-lg p-2" aria-label="Back to home">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2.5">
          <ThemedIcon className="h-7 w-7" size={28} />
          <span className="font-medium">{title}</span>
        </div>
        {needsUsername && username && (
          <button
            type="button"
            onClick={onChangeUsername}
            className="ml-2 flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-text"
          >
            <User className="h-3 w-3" />
            @{username}
          </button>
        )}
        {needsUsername && !username && (
          <button
            type="button"
            onClick={onChangeUsername}
            className="ml-2 flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs text-accent transition-colors hover:bg-accent/20"
          >
            <User className="h-3 w-3" />
            Select profile
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="relative">
          <button
            className="btn-primary min-w-[10rem] gap-2 text-sm"
            onClick={onDownload}
            disabled={isDownloading || blockedReason !== null}
            title={blockedReason ?? undefined}
            aria-busy={isDownloading}
            type="button"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting&hellip;
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PNG
              </>
            )}
          </button>
          {exportError && (
            <div
              role="alert"
              className="absolute right-0 top-full z-20 mt-2 flex w-max max-w-[min(20rem,calc(100vw-2rem))] items-start gap-2 rounded-lg border border-danger/40 bg-surface px-3 py-2 text-xs leading-snug text-danger shadow-lg"
            >
              <span>{exportError}</span>
              <button
                type="button"
                onClick={onDismissExportError}
                className="btn-ghost -mr-1 shrink-0 rounded p-0.5"
                aria-label="Dismiss export error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
