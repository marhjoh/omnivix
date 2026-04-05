const renderRouteGlobalCss = `
body:has([data-omnivix-render-root]) {
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: transparent !important;
}
body:has([data-omnivix-render-root]) #__next-build-indicator,
body:has([data-omnivix-render-root]) [data-nextjs-dialog-overlay],
body:has([data-omnivix-render-root]) nextjs-portal {
  display: none !important;
}
`;

export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: renderRouteGlobalCss }} />
      <div data-omnivix-render-root style={{ minHeight: "100vh", overflow: "hidden" }}>
        {children}
      </div>
    </>
  );
}
