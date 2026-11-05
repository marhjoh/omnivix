import { PreviewLoading, PreviewMessage } from "@/src/studio/preview/PreviewMessage";
import {
  previewEmptyCopy,
  previewLoadingMessage,
} from "@/src/studio/preview/computePreviewContentState";
import type { PreviewContentState, PreviewProblem } from "@/src/studio/preview/types";
import { useTimeReached } from "@/src/ui/useTimeReached";
import previewStyles from "@/src/studio/preview/preview.module.css";
import type { GithubDataKind } from "@/src/templates/types";

interface StatusActions {
  onRetry: () => void;
  onChangeUsername: () => void;
  /** Opens the settings with the cursor in this setting's field. */
  onEditSetting: (key: string) => void;
}

/** What the preview shows in place of the banner: loading, what's missing, or the problem. */
export function PreviewStatus({
  previewState,
  problem,
  missingSetting,
  githubData,
  ...actions
}: StatusActions & {
  previewState: Exclude<PreviewContentState, "ready">;
  problem: PreviewProblem | null;
  /** What an empty preview asks for: "username", or a required setting's key. */
  missingSetting: string | undefined;
  githubData: readonly GithubDataKind[];
}) {
  return (
    <div className={previewStyles.stateFrame}>
      <StatusContent
        previewState={previewState}
        problem={problem}
        missingSetting={missingSetting}
        githubData={githubData}
        {...actions}
      />
    </div>
  );
}

function StatusContent({
  previewState,
  problem,
  missingSetting,
  githubData,
  onRetry,
  onChangeUsername,
  onEditSetting,
}: Parameters<typeof PreviewStatus>[0]) {
  const retryReached = useTimeReached(problem?.retryAt);

  if (previewState === "loading") {
    return <PreviewLoading message={previewLoadingMessage(githubData)} />;
  }
  if (previewState === "empty") {
    if (missingSetting === undefined) return null;
    const copy = previewEmptyCopy(missingSetting);
    const { setting } = copy.action;
    return (
      <PreviewMessage
        title={copy.title}
        hint={copy.hint}
        action={{
          label: copy.action.label,
          onClick: setting === "username" ? onChangeUsername : () => onEditSetting(setting),
        }}
      />
    );
  }
  if (!problem) return null;
  return (
    <PreviewMessage
      alert
      title={problem.title}
      hint={problem.hint}
      action={problemAction(problem, { onRetry, onChangeUsername, retryReached })}
    />
  );
}

function problemAction(
  problem: PreviewProblem,
  {
    onRetry,
    onChangeUsername,
    retryReached,
  }: { onRetry: () => void; onChangeUsername: () => void; retryReached: boolean },
) {
  switch (problem.action) {
    case "retry":
      return { label: "Try again", onClick: onRetry, disabled: !retryReached };
    case "change-username":
      return { label: "Change username", onClick: onChangeUsername };
    default:
      return undefined;
  }
}
