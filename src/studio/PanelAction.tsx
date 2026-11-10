import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LabeledGroup } from "@/src/ui/FieldLabel";
import controls from "@/src/studio/controls.module.css";

/** A titled group of actions in the export panel, such as Copy. */
export function PanelActionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <LabeledGroup label={title} className="" labelClassName="field-label block px-2 pt-1 pb-1">
      {children}
    </LabeledGroup>
  );
}

/** An action in the export panel, styled like a dropdown option. */
export function PanelAction({
  Icon,
  disabled,
  onClick,
  children,
}: {
  Icon: LucideIcon;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={controls.panelAction}>
      <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      {children}
    </button>
  );
}
