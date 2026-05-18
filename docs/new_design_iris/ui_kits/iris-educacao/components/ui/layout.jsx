/* global React */
// ─── Layout primitives ─────────────────────────────────────────────────────
// Surface · SectionCard · PageHead · Tabs
// Containers and headers that arrange other primitives on a screen.

function Surface({ children, className = "" }) {
  return <div className={"card-surface " + className}>{children}</div>;
}

function SectionCard({ title, action, children }) {
  return (
    <div className="card-surface section-card">
      <div className="section-card-h">
        <div className="section-card-t">{title}</div>
        {action}
      </div>
      <div className="section-card-b">{children}</div>
    </div>
  );
}

function PageHead({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div className="ttl">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

function Tabs({ value, onChange, tabs }) {
  return (
    <div className="tabs">
      <div className="tabs-list">
        {tabs.map((t) => (
          <button
            key={t.value}
            className={"tab" + (value === t.value ? " active" : "") + (t.disabled ? " disabled" : "")}
            onClick={() => !t.disabled && onChange(t.value)}
            disabled={t.disabled}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Surface, SectionCard, PageHead, Tabs });
