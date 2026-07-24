/* global React, I, Button, Badge, PageHead, Avatar, SECONDARY_LABELS */
// Pessoas hub — rich landing for student / teacher administration.
// Each panel summarises the area (metric · recent items · CTAs).

const STATUS_LABEL = { active: "Ativo", inactive: "Inativo", transferred: "Transferido", cancelled: "Cancelado" };

function MetricChip({ icon: Icon, value, label, tone = "primary" }) {
  return (
    <div className={"pessoa-metric tone-" + tone}>
      <div className="ico"><Icon size={14} /></div>
      <div>
        <div className="v">{value}</div>
        <div className="l">{label}</div>
      </div>
    </div>
  );
}

function PersonRow({ name, meta, badge }) {
  return (
    <div className="person-row">
      <Avatar name={name} size={28} />
      <div className="info">
        <div className="nm">{name}</div>
        <div className="meta">{meta}</div>
      </div>
      {badge}
    </div>
  );
}

function PessoasHubScreen({ onNavigate, data }) {
  const students = data?.students || [];
  const activeStudents = students.filter((s) => s.status === "active").length;
  const recentStudents = students.slice(0, 4);

  // No teachers seed yet — pull from the subjects → teachers list
  const teacherMap = new Map();
  (data?.subjects || []).forEach((sub) => {
    sub.teachers.forEach((t) => {
      if (!teacherMap.has(t.id)) teacherMap.set(t.id, { ...t, subjects: [] });
      teacherMap.get(t.id).subjects.push(sub.name);
    });
  });
  const teachers = Array.from(teacherMap.values());
  const recentTeachers = teachers.slice(0, 4);

  return (
    <div className="stack-6">
      <PageHead
        title="Pessoas"
        subtitle="Alunos, professores, responsáveis — tudo num só lugar"
      />

      <div className="pessoas-grid">
        {/* ── Alunos panel ───────────────────────────────────────────── */}
        <section className="pessoa-panel">
          <header>
            <div className="ico-tile alunos"><I.Users size={22} /></div>
            <div>
              <h2>Alunos</h2>
              <p>Cadastro, matrículas, boletim e histórico individual.</p>
            </div>
            <div className="cta-row">
              <Button size="sm" icon={I.Plus} onClick={() => onNavigate("alunos")}>Novo aluno</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate("alunos")}>Ver todos</Button>
            </div>
          </header>

          <div className="metrics-row">
            <MetricChip icon={I.Users}        value={students.length}      label="Cadastrados" tone="primary" />
            <MetricChip icon={I.CheckCircle}  value={activeStudents}       label="Ativos"      tone="success" />
            <MetricChip icon={I.UserPlus}     value="+8"                   label="Esta semana" tone="info" />
            <MetricChip icon={I.Alert}        value="2"                    label="Transferidos" tone="warning" />
          </div>

          <div className="recent">
            <div className="recent-h">
              <span>Recentes</span>
              <a onClick={() => onNavigate("alunos")}>Ver todos →</a>
            </div>
            <div className="recent-list">
              {recentStudents.map((s) => (
                <PersonRow
                  key={s.id}
                  name={s.name}
                  meta={<><span className="mono">{s.code}</span> · {s.cls}</>}
                  badge={<Badge variant={s.status === "active" ? "success" : "outline"}>{STATUS_LABEL[s.status] || s.status}</Badge>}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Professores panel ──────────────────────────────────────── */}
        <section className="pessoa-panel">
          <header>
            <div className="ico-tile profs"><I.GraduationCap size={22} /></div>
            <div>
              <h2>Professores</h2>
              <p>Cadastro, disciplinas vinculadas e quadro de aulas.</p>
            </div>
            <div className="cta-row">
              <Button size="sm" icon={I.Plus} onClick={() => onNavigate("professores")}>Novo professor</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate("professores")}>Ver todos</Button>
            </div>
          </header>

          <div className="metrics-row">
            <MetricChip icon={I.GraduationCap} value={teachers.length}            label="Cadastrados" tone="primary" />
            <MetricChip icon={I.BookOpen}      value={data?.subjects?.length || 0} label="Disciplinas"  tone="info" />
            <MetricChip icon={I.Calendar}      value="14"                          label="Vínculos"     tone="success" />
            <MetricChip icon={I.Clock}         value="3"                           label="Pendências"   tone="warning" />
          </div>

          <div className="recent">
            <div className="recent-h">
              <span>Quadro docente</span>
              <a onClick={() => onNavigate("professores")}>Ver todos →</a>
            </div>
            <div className="recent-list">
              {recentTeachers.map((t) => (
                <PersonRow
                  key={t.id}
                  name={t.name}
                  meta={<>{t.position || "Professor(a)"} · {t.subjects.slice(0, 2).join(", ")}{t.subjects.length > 2 ? "…" : ""}</>}
                  badge={<Badge variant="info">{t.subjects.length} disc.</Badge>}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Atalhos secundários ─────────────────────────────────────── */}
      <div>
        <div className="pessoa-quick-h">Atalhos rápidos</div>
        <div className="pessoa-quick">
          <button className="quick-card" onClick={() => onNavigate("alunos")}>
            <div className="ico"><I.Search size={16} /></div>
            <div className="lab">Buscar aluno</div>
          </button>
          <button className="quick-card" onClick={() => onNavigate("matricula")}>
            <div className="ico"><I.UserPlus size={16} /></div>
            <div className="lab">Matricular em turma</div>
          </button>
          <button className="quick-card" onClick={() => onNavigate("alunos")}>
            <div className="ico"><I.FileText size={16} /></div>
            <div className="lab">Importar planilha</div>
          </button>
          <button className="quick-card" onClick={() => onNavigate("alunos")}>
            <div className="ico"><I.BookOpen size={16} /></div>
            <div className="lab">Relatório de alunos</div>
          </button>
        </div>
      </div>
    </div>
  );
}

window.PessoasHubScreen = PessoasHubScreen;
