/* global React, I, Button, Badge, PageHead, Dialog, LOC_tone, LOC_initials */

function StudentChip({ student, picked, onPick }) {
  const t = LOC_tone(student.name);
  return (
    <div
      className={"drag-chip" + (picked ? " selected" : "")}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("studentId", student.id);
        e.dataTransfer.setData("studentName", student.name);
      }}
      onClick={onPick}
      title="Arraste para a turma ou clique para selecionar"
    >
      <span className="grip"><I.Grip size={12} /></span>
      <span className="av" style={{ background: t.solid }}>{LOC_initials(student.name)}</span>
      <div className="info">
        <div className="nm">{student.name}</div>
        <div className="meta" style={{ fontFamily: "var(--font-mono)" }}>{student.code}</div>
      </div>
    </div>
  );
}

function EnrolledPill({ student, onRemove }) {
  const t = LOC_tone(student.name);
  return (
    <div className="enrolled-pill" style={{ background: t.soft, borderColor: t.border, color: t.text }}>
      <span className="av" style={{ background: t.solid }}>{LOC_initials(student.name)}</span>
      <span className="nm">{student.name}</span>
      <button className="rm" onClick={onRemove} title="Remover"><I.X size={11} /></button>
    </div>
  );
}

function ClassColumn({ cls, enrolled, picked, allStudents, onDrop, onRemove }) {
  const [over, setOver] = React.useState(false);
  const counter = React.useRef(0);
  const max = cls.maxStudents;
  const count = enrolled.length;
  const isFull = count >= max;
  const pct = Math.min(100, Math.round((count / max) * 100));
  const fillColor = pct >= 100 ? "var(--iris-danger-600)"
                  : pct >= 80  ? "var(--iris-warning-600)"
                              : "var(--iris-success-600)";

  function handleDrop(e) {
    e.preventDefault();
    counter.current = 0;
    setOver(false);
    const id = e.dataTransfer.getData("studentId");
    const name = e.dataTransfer.getData("studentName");
    if (id) onDrop(cls.id, id, name);
  }

  return (
    <div
      className={"kanban-col" + (over ? " over" : "") + (isFull ? " full" : "")}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => { e.preventDefault(); counter.current++; setOver(true); }}
      onDragLeave={() => { counter.current--; if (counter.current <= 0) setOver(false); }}
      onDrop={handleDrop}
    >
      <div className="col-head">
        <div className="col-h-row">
          <div>
            <div className="col-name">{cls.name}</div>
            <div className="col-meta">
              <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{cls.serieName}</span>
              <Badge variant="outline">{cls.shift}</Badge>
            </div>
          </div>
          <div className="col-cap"><I.Users size={11} /> {count}/{max}</div>
        </div>
        <div className="cap-bar"><div className="fill" style={{ width: pct + "%", background: fillColor }}></div></div>
      </div>

      {over && !isFull && (
        <div className="drop-hint ok">Soltar para matricular</div>
      )}
      {over && isFull && (
        <div className="drop-hint bad"><I.AlertTriangle size={11} /> Turma lotada</div>
      )}

      <div className="col-body">
        {enrolled.length === 0
          ? <div className="col-empty">Nenhum aluno matriculado.</div>
          : enrolled.map((s) => <EnrolledPill key={s.id} student={s} onRemove={() => onRemove(cls.id, s.id)} />)}
      </div>

      {picked && !isFull && !enrolled.some((s) => s.id === picked.studentId) && (
        <div className="col-foot">
          <button className="quick" onClick={() => onDrop(cls.id, picked.studentId, picked.studentName)}>
            <I.Plus size={11} /> Matricular {picked.studentName.split(" ")[0]} aqui
          </button>
        </div>
      )}
    </div>
  );
}

function LocacaoAlunosScreen({ data, onBack, showToast }) {
  const [q, setQ] = React.useState("");
  const [picked, setPicked] = React.useState(null);
  // enrolment state: classId → array of student id
  const [enrolment, setEnrolment] = React.useState(data.initialEnrolment || {});
  const [confirm, setConfirm] = React.useState(null);

  function attemptDrop(classId, studentId, studentName) {
    const cls = data.classes.find((c) => c.id === classId);
    const currentIds = enrolment[classId] || [];
    if (currentIds.includes(studentId)) { showToast("Aluno já está nesta turma", "success"); return; }
    if (currentIds.length >= cls.maxStudents) { showToast("Turma lotada — limite máximo atingido"); return; }
    setConfirm({ classId, studentId, studentName, className: cls.name });
  }
  function confirmEnroll() {
    if (!confirm) return;
    setEnrolment((m) => ({ ...m, [confirm.classId]: [...(m[confirm.classId] || []), confirm.studentId] }));
    showToast(`${confirm.studentName.split(" ")[0]} matriculado em ${confirm.className}`);
    setConfirm(null);
    setPicked(null);
  }
  function remove(classId, studentId) {
    setEnrolment((m) => ({ ...m, [classId]: (m[classId] || []).filter((id) => id !== studentId) }));
    showToast("Aluno removido da turma");
  }

  const filteredStudents = data.students.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) || (s.code || "").toLowerCase().includes(q.toLowerCase())
  );

  function studentsFor(classId) {
    return (enrolment[classId] || []).map((id) => data.students.find((s) => s.id === id)).filter(Boolean);
  }

  const totalEnrolled = Object.values(enrolment).reduce((a, ids) => a + ids.length, 0);

  return (
    <div className="stack-4" style={{ height: "100%" }}>
      <PageHead
        title="Locação de Alunos"
        subtitle="Arraste alunos para turmas e controle a capacidade"
        actions={<Button variant="ghost" size="sm" onClick={onBack}>Voltar</Button>}
      />

      <div className="loc-shell">
        {/* Left rail: students */}
        <div className="loc-rail">
          <div className="rail-head">
            <h2>Alunos</h2>
            <div className="sub">Arraste para uma turma ou clique para selecionar</div>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--iris-slate-500)" }}><I.Search size={13} /></span>
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Buscar aluno ou matrícula…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {picked && (
            <div className="loc-pick">
              <span><I.Zap size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />{picked.studentName.split(" ")[0]} selecionado</span>
              <button onClick={() => setPicked(null)}><I.X size={12} /></button>
            </div>
          )}
          <div className="rail-scroll">
            {filteredStudents.map((s) => (
              <StudentChip
                key={s.id}
                student={s}
                picked={picked && picked.studentId === s.id}
                onPick={() => setPicked((p) => p && p.studentId === s.id ? null : { studentId: s.id, studentName: s.name })}
              />
            ))}
            {filteredStudents.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", padding: 24 }}>Nenhum aluno encontrado.</div>
            )}
          </div>
          <div className="rail-foot">
            <b>{data.students.length}</b> alunos · <b>{totalEnrolled}</b> matrículas ativas
          </div>
        </div>

        {/* Main: kanban */}
        <div className="loc-main">
          <div className="main-head">
            <div>
              <h2>Turmas</h2>
              <div className="sub">{data.classes.length} turmas · arraste alunos para o card</div>
            </div>
          </div>
          <div className="kanban-row">
            {data.classes.map((c) => (
              <ClassColumn
                key={c.id}
                cls={c}
                enrolled={studentsFor(c.id)}
                picked={picked}
                allStudents={data.students}
                onDrop={attemptDrop}
                onRemove={remove}
              />
            ))}
          </div>
        </div>
      </div>

      <Dialog
        open={!!confirm}
        title="Confirmar matrícula"
        onClose={() => setConfirm(null)}
        footer={<>
          <Button variant="outline" size="sm" onClick={() => setConfirm(null)}>Cancelar</Button>
          <Button size="sm" onClick={confirmEnroll}>Confirmar</Button>
        </>}
      >
        <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>
          Matricular <b style={{ color: "var(--fg-1)" }}>{confirm?.studentName}</b> na turma <b style={{ color: "var(--fg-1)" }}>{confirm?.className}</b>?
        </div>
      </Dialog>
    </div>
  );
}

window.LocacaoAlunosScreen = LocacaoAlunosScreen;
