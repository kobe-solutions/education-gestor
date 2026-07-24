/* global React, I, Button, Badge, Select, PageHead, LOC_tone, LOC_initials */
// Locação de Aulas — drag-drop weekly timetable for one class at a time.
// Left rail: collapsible subjects → teachers (chips).
// Main: 5 days × 5 periods grid; drop a teacher chip into a slot to alloc.

// ─── Time slots & week shape ────────────────────────────────────────────────
const WEEK = [
  { id: "mon", label: "Seg" },
  { id: "tue", label: "Ter" },
  { id: "wed", label: "Qua" },
  { id: "thu", label: "Qui" },
  { id: "fri", label: "Sex" },
];
const TIMESLOTS = [
  { id: "p1", start: "07:30", end: "08:20" },
  { id: "p2", start: "08:20", end: "09:10" },
  { id: "p3", start: "09:30", end: "10:20" },
  { id: "p4", start: "10:20", end: "11:10" },
  { id: "p5", start: "11:10", end: "12:00" },
];

// ─── Draggable teacher chip ──────────────────────────────────────────────────
function TeacherChip({ teacher, subject, onPick, picked }) {
  const t = LOC_tone(teacher.name);
  return (
    <div
      className={"drag-chip" + (picked ? " selected" : "")}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("teacherId",   teacher.id);
        e.dataTransfer.setData("teacherName", teacher.name);
        e.dataTransfer.setData("subjectId",   subject.id);
        e.dataTransfer.setData("subjectName", subject.name);
      }}
      onClick={onPick}
      title="Arraste para a grade ou clique para selecionar"
    >
      <span className="grip"><I.Grip size={12} /></span>
      <span className="av" style={{ background: t.solid }}>{LOC_initials(teacher.name)}</span>
      <div className="info">
        <div className="nm">{teacher.name}</div>
        <div className="meta">{teacher.position || "Professor(a)"}</div>
      </div>
    </div>
  );
}

// ─── Subject card (collapsible parent) ───────────────────────────────────────
function SubjectCard({ subject, openByDefault, picked, onPick }) {
  const [open, setOpen] = React.useState(!!openByDefault);
  const t = LOC_tone(subject.name);
  return (
    <div className={"subj-card" + (open ? " open" : "")}>
      <div className="subj-head" onClick={() => setOpen((v) => !v)}>
        <span className="swatch" style={{ background: t.solid }}></span>
        <div className="info">
          <div className="nm">{subject.name}</div>
          <div className="ds">{subject.teachers.length} professor(es)</div>
        </div>
        <span className="caret"><I.ChevronDown size={14} /></span>
      </div>
      {open && (
        <div className="subj-teachers">
          {subject.teachers.map((te) => (
            <TeacherChip
              key={te.id}
              teacher={te}
              subject={subject}
              picked={picked && picked.teacherId === te.id && picked.subjectId === subject.id}
              onPick={() => onPick({ teacherId: te.id, teacherName: te.name, subjectId: subject.id, subjectName: subject.name })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lesson pill (placed in a slot) ──────────────────────────────────────────
function LessonPill({ lesson, onRemove }) {
  const t  = LOC_tone(lesson.subjectName);
  const tt = LOC_tone(lesson.teacherName);
  return (
    <div className="lesson-pill" style={{ background: t.soft, borderColor: t.border, color: t.text }}>
      <div className="ln-sub">{lesson.subjectName}</div>
      <div className="ln-tea">
        <span className="dot" style={{ background: tt.solid }}></span>
        {lesson.teacherName.split(" ")[0]} · {lesson.start}
      </div>
      <button className="rm" onClick={onRemove} title="Remover"><I.X size={11} /></button>
    </div>
  );
}

// ─── Week grid for one class ─────────────────────────────────────────────────
function WeekGrid({ lessons, onDrop, onRemove, dragOver, setDragOver }) {
  return (
    <div className="timetable">
      <div className="timetable-grid">
        <div className="timetable-cell head"></div>
        {WEEK.map((d) => <div key={d.id} className="timetable-cell head">{d.label}</div>)}
        {TIMESLOTS.map((slot) => (
          <React.Fragment key={slot.id}>
            <div className="timetable-cell time">{slot.start}<br />{slot.end}</div>
            {WEEK.map((d) => {
              const key = d.id + ":" + slot.id;
              const lesson = lessons[key];
              const isOver = dragOver === key;
              return (
                <div
                  key={d.id}
                  className={"timetable-cell slot" + (isOver ? " over" : "") + (!lesson ? " empty-hint" : "")}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const payload = {
                      teacherId:   e.dataTransfer.getData("teacherId"),
                      teacherName: e.dataTransfer.getData("teacherName"),
                      subjectId:   e.dataTransfer.getData("subjectId"),
                      subjectName: e.dataTransfer.getData("subjectName"),
                    };
                    if (payload.teacherId) onDrop(d.id, slot, payload);
                  }}
                >
                  {lesson
                    ? <LessonPill lesson={lesson} onRemove={() => onRemove(key)} />
                    : <span>+ Arraste</span>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
function LocacaoAulasScreen({ data, onBack, showToast }) {
  const [classId, setClassId]                   = React.useState(data.classes[0]?.id || "");
  const cls = data.classes.find((c) => c.id === classId) || data.classes[0];
  const [lessonsByClass, setLessonsByClass]     = React.useState(data.initialLessons || {});
  const lessons = lessonsByClass[classId] || {};
  const [picked, setPicked]                     = React.useState(null);
  const [dragOver, setDragOver]                 = React.useState(null);
  const [subjectFilter, setSubjectFilter]       = React.useState("");

  function drop(dayId, slot, payload) {
    const key  = dayId + ":" + slot.id;
    const next = { ...lessons, [key]: { ...payload, day: dayId, start: slot.start, end: slot.end } };
    setLessonsByClass((m) => ({ ...m, [classId]: next }));
    showToast(`${payload.subjectName} · ${payload.teacherName.split(" ")[0]} alocado em ${WEEK.find((d) => d.id === dayId).label} ${slot.start}`);
  }
  function remove(key) {
    const next = { ...lessons }; delete next[key];
    setLessonsByClass((m) => ({ ...m, [classId]: next }));
    showToast("Aula removida");
  }

  const subjects = data.subjects.filter((sj) => !subjectFilter || sj.name.toLowerCase().includes(subjectFilter.toLowerCase()));
  const totalAlocadas = Object.keys(lessons).length;

  return (
    <div className="stack-4" style={{ height: "100%" }}>
      <PageHead
        title="Locação de Aulas"
        subtitle="Monte a grade horária — arraste o professor para o slot da turma"
        actions={<Button variant="ghost" size="sm" onClick={onBack}>Voltar</Button>}
      />

      <div className="class-picker">
        <div>
          <div className="pick-l">Montando turma</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 2 }}>
            <span className="pick-v">{cls.name}</span>
            <span className="pick-meta">{cls.serieName} · {cls.shift}</span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", width: 240 }}>
          <Select
            value={classId}
            onChange={setClassId}
            options={data.classes.map((c) => ({ value: c.id, label: `${c.name} · ${c.shift}` }))}
            placeholder="Selecionar turma…"
          />
        </div>
        <Badge variant="info">{totalAlocadas}/{WEEK.length * TIMESLOTS.length} slots</Badge>
      </div>

      <div className="loc-shell">
        {/* Left rail */}
        <div className="loc-rail">
          <div className="rail-head">
            <h2>Disciplinas & professores</h2>
            <div className="sub">Abra uma disciplina para revelar os professores</div>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--iris-slate-500)" }}>
              <I.Search size={13} />
            </span>
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Buscar disciplina…" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} />
          </div>
          {picked && (
            <div className="loc-pick">
              <span><I.Zap size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />{picked.subjectName} · {picked.teacherName.split(" ")[0]}</span>
              <button onClick={() => setPicked(null)}><I.X size={12} /></button>
            </div>
          )}
          <div className="rail-scroll">
            {subjects.map((sj, i) => (
              <SubjectCard key={sj.id} subject={sj} openByDefault={i === 0} picked={picked} onPick={setPicked} />
            ))}
            {subjects.length === 0 && <div style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", padding: 24 }}>Nenhuma disciplina encontrada.</div>}
          </div>
          <div className="rail-foot">
            <b>{data.subjects.length}</b> disciplinas · <b>{data.subjects.reduce((a, s) => a + s.teachers.length, 0)}</b> vínculos com professores
          </div>
        </div>

        {/* Main: timetable */}
        <div className="loc-main">
          <div className="main-head">
            <div>
              <h2>Grade semanal</h2>
              <div className="sub">{totalAlocadas} {totalAlocadas === 1 ? "aula alocada" : "aulas alocadas"} · {WEEK.length} dias · {TIMESLOTS.length} aulas/dia</div>
            </div>
          </div>
          <WeekGrid lessons={lessons} onDrop={drop} onRemove={remove} dragOver={dragOver} setDragOver={setDragOver} />
        </div>
      </div>
    </div>
  );
}

window.LocacaoAulasScreen = LocacaoAulasScreen;
