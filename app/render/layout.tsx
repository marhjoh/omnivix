export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <style>{`
          body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
          #__next-build-indicator, [data-nextjs-dialog-overlay], nextjs-portal { display: none !important; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
