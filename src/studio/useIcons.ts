import { iconsUrl, type TechIcon } from "@/src/icons/iconSelection";
import type { PreviewProblem } from "@/src/studio/preview/types";
import { initialData, useApiQuery } from "@/src/studio/useApiQuery";

const LOAD_PROBLEM: PreviewProblem = {
  title: "Couldn't load the icons",
  hint: "Check your connection, then try again.",
  action: "retry",
};

/**
 * Loads the icons in an `icons` setting. While a changed selection loads, the last icons stay, so
 * the preview and the picker don't flash. The preview and the picker share one request.
 */
export function useIcons(value: string, initialApiData: Record<string, unknown> = {}) {
  const url = iconsUrl(value);
  const query = useApiQuery<TechIcon[]>(url, {
    keepKey: "icons",
    initial: initialData<TechIcon[]>(initialApiData, url),
  });
  return {
    data: query.data,
    /** True once the icons for this selection are in, or when there are none to load. */
    ready: url === null || (query.data !== undefined && !query.stale),
    /** Icons from the previous selection are showing while this one loads. */
    stale: query.stale,
    problem: query.error ? LOAD_PROBLEM : null,
    retry: () => {
      if (query.error) void query.refetch();
    },
  };
}
