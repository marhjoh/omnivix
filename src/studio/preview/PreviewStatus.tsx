import { PreviewLoading, PreviewMessage } from "@/src/studio/preview/PreviewMessage";
import {
  previewEmptyCopy,
  previewLoadingMessage,
} from "@/src/studio/preview/computePreviewContentState";
import type { PreviewContentState, PreviewProblem } from "@/src/studio/preview/types";
import { useTimeReached } from "@/src/ui/useTimeReached";
import previewStyles from "@/src/studio/preview/preview.module.css";
import type { GithubDataKind } from "@/src/templates/types";

/** What the preview shows in place of the banner: loading, what's missing, or the problem. */
export function PreviewStatus({
  previewState,
  problem,
  missingSetting,
  githubData,
  onRetry,
  onChangeUsername,
  onEditSetting,
}: {
  previewState: Exclude<PreviewContentState, "ready">;
  problem: PreviewProblem | null;
  /** What an empty preview asks for: "username", or a required setting's key. */
  missingSetting: string | undefined;
  githubData: readonly GithubDataKind[];
  onRetry: () => void;
  onChangeUsername: () => void;
  /** Opens the settings with the cursor in this setting's field. */
  onEditSetting: (key: string) => void;
}) {
  const retryReached = useTimeReached(problem?.retryAt);

  let content;
  if (previewState === "loading") {
    content = <PreviewLoading message={previewLoadingMessage(githubData)} />;
  } else if (previewState === "empty") {
    const setting = missingSetting!;
    const copy = previewEmptyCopy(setting);
    content = (
      <PreviewMessage
        title={copy.title}
        hint={copy.hint}
        action={{
          label: copy.actionLabel,
          onClick: setting === "username" ? onChangeUsername : () => onEditSetting(setting),
        }}
      />
    );
  } else {
    const { title, hint, action } = problem!;
    content = (
      <PreviewMessage
        alert
        title={title}
        hint={hint}
        action={
          action === "retry"
            ? { label: "Try again", onClick: onRetry, disabled: !retryReached }
            : action === "change-username"
              ? { label: "Change username", onClick: onChangeUsername }
              : undefined
        }
      />
    );
  }
  return <div className={previewStyles.stateFrame}>{content}</div>;
}
