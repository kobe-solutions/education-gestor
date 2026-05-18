/* global React, I */
// ─── Display primitives ────────────────────────────────────────────────────
// Badge · Avatar · MetricCard · HubCard · TuitionStatusBadge

function Badge({ variant = "info", children }) {
  return <span className={"badge " + variant}>{children}</span>;
}

function Avatar({ src, name, size = 32 }) {
  const init = (name || "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((s) => s[0]).join("").toUpperCase();
  return (
    <div
      className="avatar-circle"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {src ? <img src={src} alt={name} /> : <span>{init}</span>}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="metric">
      <div className="ico" style={{ background: color }}><Icon size={20} /></div>
      <div>
        <div className="v">{value}</div>
        <div className="l">{label}</div>
        {sub ? <div className="s">{sub}</div> : null}
      </div>
    </div>
  );
}

function HubCard({ icon: Icon, title, description, onClick }) {
  return (
    <a className="hub-card" onClick={onClick}>
      <div className="ico-tile"><Icon size={20} /></div>
      <div>
        <div className="tt">{title}</div>
        <div className="ds">{description}</div>
      </div>
      <div className="lk">Acessar <I.ArrowRight size={11} /></div>
    </a>
  );
}

// Domain-specific badge variant: maps tuition status → coloured chip.
// Lives in display because it's a pure presentation atom.
function TuitionStatusBadge({ status }) {
  const map = {
    paid:    ["success", "Pago"],
    pending: ["warning", "Pendente"],
    overdue: ["danger",  "Atrasado"],
  };
  const [v, l] = map[status] || ["info", status];
  return <Badge variant={v}>{l}</Badge>;
}

Object.assign(window, { Badge, Avatar, MetricCard, HubCard, TuitionStatusBadge });
