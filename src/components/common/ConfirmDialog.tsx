import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  names: string[];
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认删除",
  names,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const preview = names.slice(0, 8);
  const rest = names.length - preview.length;

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-title">{title}</h3>
        <p>{description}</p>
        <ul className="dialog-list">
          {preview.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        {rest > 0 ? <p className="muted">另外还有 {rest} 项</p> : null}
        <div className="dialog-actions">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            取消
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "删除中..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
