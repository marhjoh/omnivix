import Link from "next/link";
import { getTemplates } from "@/src/templates/registry";
import { Hero } from "@/src/landing/Hero";
import { TemplateGallery } from "@/src/landing/TemplateGallery";
import type { TemplateMeta } from "@/src/types/template";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { ThemedIcon, ThemedLogo } from "@/src/theme/ThemedBrand";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function Home() {
  const templates: TemplateMeta[] = getTemplates().map((t) => t.meta);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <ThemedLogo className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="#templates" className="btn-ghost hidden px-3 py-2 text-sm sm:inline-flex">
              Templates
            </Link>
            <ThemeToggle />
            <a
              href="https://github.com/marhjoh/omnivix"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost rounded-lg p-2"
              aria-label="GitHub"
            >
              <GithubIcon className="h-[18px] w-[18px]" />
            </a>
            <Link href="#templates" className="btn-primary ml-2 px-4 py-2 text-sm">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        <TemplateGallery templates={templates} />
      </main>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <ThemedIcon className="h-6 w-6" size={24} />
            <span className="text-sm text-muted">Omnivix &mdash; Social Banner Generator</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link href="#templates" className="transition-colors hover:text-text">
              Templates
            </Link>
            <a
              href="https://github.com/marhjoh/omnivix"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-text"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
