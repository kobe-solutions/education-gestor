/* global React, I, Badge, PageHead */

function EstruturaScreen({ data }) {
  return (
    <div className="stack-4">
      <PageHead
        title="Estrutura Escolar"
        subtitle="Hierarquia completa: Nível de Ensino → Série → Turma"
        actions={
          <div className="row-2" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            <span className="row-2"><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(24,95,165,.18)", border: "1px solid rgba(24,95,165,.4)" }}></span> Nível</span>
            <span className="row-2"><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--iris-slate-100)", border: "1px solid var(--border-1)" }}></span> Série</span>
            <span className="row-2"><span style={{ width: 10, height: 10, borderRadius: 9999, background: "#fff", border: "1px solid var(--iris-blue-300)" }}></span> Turma</span>
          </div>
        }
      />

      {data.levels.map((lv) => (
        <div className="tree-node" key={lv.id}>
          <div className="tree-head">
            <div className="ico"><I.Layers size={16} /></div>
            <div style={{ flex: 1 }}>
              <div className="row-2">
                <div className="tt">{lv.name}</div>
                <Badge variant="outline">{lv.type}</Badge>
              </div>
              <div className="ds">{lv.series.length} séries · {lv.series.reduce((acc, s) => acc + s.classes.length, 0)} turmas</div>
            </div>
            <I.Chevron size={14} />
          </div>
          <div className="tree-body">
            {lv.series.map((sr) => (
              <div className="tree-serie" key={sr.id}>
                <div className="tree-serie-h">
                  <div className="ico"><I.GraduationCap size={12} /></div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{sr.name}</span>
                  <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{sr.classes.length} {sr.classes.length === 1 ? "turma" : "turmas"}</span>
                </div>
                <div className="chip-row">
                  {sr.classes.map((c) => (
                    <span className="chip" key={c.id}>
                      <I.BookOpen size={11} /> {c.name} <span style={{ opacity: .6 }}>· {c.shift}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

window.EstruturaScreen = EstruturaScreen;
