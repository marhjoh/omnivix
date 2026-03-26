import Link from "next/link";
import { ArrowLeft, Download, Loader2, User } from "lucide-react";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { ThemedIcon } from "@/src/theme/ThemedBrand";

export function TopBar({
  title,
  onDownload,
  isDownloading,
  canExport,
  username,
  needsUsername,
  onChangeUsername,
}: {
  title: string;
  onDownload: () => void;
  isDownloading: boolean;
  canExport?: boolean;
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
        <button
          className="btn-primary gap-2 text-sm"
          onClick={onDownload}
          disabled={isDownloading || canExport === false}
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
      </div>
    </>
  );
}
