/* global React, I */
// App icon-rail sidebar. Same shape as apps/web/src/components/layout/AppLayout.tsx.

function Sidebar({ active, onNavigate, onLogout }) {
  const items = [
    { key: "dashboard", label: "Painel",        icon: I.Dashboard,     match: ["dashboard"] },
    { key: "pessoas",   label: "Pessoas",       icon: I.Users,         match: ["pessoas", "alunos", "professores", "aluno"] },
    { key: "academico", label: "Acadêmico",     icon: I.BookOpen,      match: ["academico", "estrutura", "locacao", "matricula"] },
    { key: "financial", label: "Financeiro",    icon: I.Dollar,        match: ["financial"] },
    { key: "config",    label: "Configuração.", icon: I.Settings,      match: ["config"] },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <svg width="32" height="32" viewBox="0 0 120 120">
          <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#042C53" strokeWidth="3.4" />
          <circle cx="60" cy="60" r="18" fill="#378ADD" />
          <circle cx="60" cy="60" r="12" fill="#185FA5" />
          <circle cx="60" cy="60" r="7"  fill="#042C53" />
        </svg>
      </div>
      <nav>
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = it.match.includes(active);
          return (
            <button
              key={it.key}
              className={"nav-item" + (isActive ? " active" : "")}
              onClick={() => onNavigate(it.key)}
            >
              <Icon size={18} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="nav-foot">
        <button className="nav-item" onClick={onLogout}>
          <I.LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
