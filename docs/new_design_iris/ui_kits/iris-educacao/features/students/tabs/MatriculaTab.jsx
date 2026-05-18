/* global React, I, Button, Badge, Select, SectionCard, STATUS_LABELS, STATUS_OPTS */
// Tab 5 — Enrolment metadata + class membership.

function MatriculaTab({ s, onChange, allClasses, onAddClass, onRemoveClass }) {
  const [pendingClass, setPendingClass] = React.useState("");
  const availableClasses = allClasses.filter((c) => !(s.classes || []).some((sc) => sc.id === c.id));

  return (
    <div className="stack-4">
      <SectionCard title="Dados de matrícula">
        <div className="kv-grid">
          <div className="kv"><div className="k">Número de matrícula</div><div className="v" style={{ fontFamily: "var(--font-mono)" }}>{s.code}</div></div>
          <div className="kv"><div className="k">Código interno</div>     <div className="v">{s.internalCode || "—"}</div></div>
          <div className="kv"><div className="k">Data de ingresso</div>   <div className="v">{s.enrollmentDate || "—"}</div></div>
          <div className="kv"><div className="k">Situação</div>           <div className="v"><Badge variant={s.status === "active" ? "success" : "outline"}>{STATUS_LABELS[s.status]}</Badge></div></div>
        </div>
      </SectionCard>

      <SectionCard title="Alterar situação">
        <div style={{ width: 240 }}>
          <Select value={s.status} onChange={(v) => onChange({ status: v })} options={STATUS_OPTS} />
        </div>
      </SectionCard>

      <SectionCard title="Turmas" action={<span style={{ fontSize: 11, color: "var(--fg-3)" }}>{(s.classes || []).length} turma(s)</span>}>
        {(s.classes || []).length === 0 && (
          <div style={{ padding: "12px 0", textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>
            Aluno não está matriculado em nenhuma turma.
          </div>
        )}
        {(s.classes || []).map((c) => (
          <div className="cls-row" key={c.id}>
            <div className="nm"><I.BookOpen size={14} /> {c.name}</div>
            <button className="btn ghost icon" onClick={() => onRemoveClass(c.id)} title="Remover" style={{ color: "var(--iris-danger-600)" }}>
              <I.X size={14} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <div style={{ flex: 1 }}>
            <Select
              value={pendingClass}
              onChange={setPendingClass}
              placeholder="Selecionar turma…"
              options={availableClasses.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <Button icon={I.Plus} disabled={!pendingClass} onClick={() => { onAddClass(pendingClass); setPendingClass(""); }}>Adicionar</Button>
        </div>
      </SectionCard>
    </div>
  );
}

window.MatriculaTab = MatriculaTab;
