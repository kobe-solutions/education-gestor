/* global React, I */
// ─── Feedback primitives ───────────────────────────────────────────────────
// Dialog · Toast · EmptyState

function Dialog({ open, title, description, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="dlg-scrim" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="title">{title}</div>
          {description ? <div className="desc">{description}</div> : null}
        </div>
        <div className="body">{children}</div>
        {footer ? <div className="foot">{footer}</div> : null}
      </div>
    </div>
  );
}

function Toast({ message, kind = "success" }) {
  if (!message) return null;
  return (
    <div className={"toast " + kind}>
      <I.CheckCircle size={16} />
      {message}
    </div>
  );
}

function EmptyState({ icon: Icon = I.Smile, title, description, action }) {
  return (
    <div className="empty">
      <Icon size={36} />
      <div className="ttl">{title}</div>
      {description ? <div className="ds">{description}</div> : null}
      {action}
    </div>
  );
}

Object.assign(window, { Dialog, Toast, EmptyState });
