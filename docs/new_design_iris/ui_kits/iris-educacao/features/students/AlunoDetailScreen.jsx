/* global React, I, Button, Badge, Tabs, STATUS_LABELS,
   PessoalTab, FamiliaTab, SaudeTab, DocumentosTab, MatriculaTab */
// Aluno detail — header + 5 tabbed sub-screens.
// Each tab lives in features/students/tabs/. This file orchestrates state.

function AlunoDetailScreen({ student, mode, allClasses, onBack, onSave, showToast }) {
  const [tab,   setTab]   = React.useState("pessoal");
  const [draft, setDraft] = React.useState(student);

  // Reset draft + jump to first tab when a different student is loaded.
  React.useEffect(() => { setDraft(student); setTab("pessoal"); }, [student?.id]);

  const isNew = mode === "new";
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  // ── Save handlers ─────────────────────────────────────────────────
  function savePersonal() { onSave(draft); showToast(isNew ? `Aluno cadastrado · Matrícula ${draft.code}` : "Dados pessoais salvos"); }
  function saveFamilia()  { onSave(draft); showToast("Dados de família salvos"); }
  function saveMedical()  { onSave(draft); showToast("Ficha médica salva"); }

  // ── Photo upload — local preview via FileReader ───────────────────
  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      patch({ photoUrl: reader.result });
      onSave({ ...draft, photoUrl: reader.result });
      showToast("Foto atualizada");
    };
    reader.readAsDataURL(file);
  }

  // ── Guardians ─────────────────────────────────────────────────────
  function addGuardian(g) {
    const next = { ...draft, guardians: [{ id: "g" + Math.random().toString(36).slice(2, 7), ...g }, ...(draft.guardians || [])] };
    setDraft(next); onSave(next); showToast("Responsável adicionado");
  }
  function removeGuardian(id) {
    const next = { ...draft, guardians: (draft.guardians || []).filter((g) => g.id !== id) };
    setDraft(next); onSave(next); showToast("Responsável removido");
  }

  // ── Documents ─────────────────────────────────────────────────────
  function uploadDoc(doc) {
    const next = { ...draft, documents: [doc, ...(draft.documents || [])] };
    setDraft(next); onSave(next); showToast("Documento anexado");
  }
  function removeDoc(id) {
    const next = { ...draft, documents: (draft.documents || []).filter((d) => d.id !== id) };
    setDraft(next); onSave(next); showToast("Documento removido");
  }

  // ── Class membership ──────────────────────────────────────────────
  function addToClass(id) {
    const cls = allClasses.find((c) => c.id === id);
    if (!cls) return;
    const next = { ...draft, classes: [...(draft.classes || []), cls] };
    setDraft(next); onSave(next); showToast(`Aluno adicionado à turma ${cls.name}`);
  }
  function removeFromClass(id) {
    const next = { ...draft, classes: (draft.classes || []).filter((c) => c.id !== id) };
    setDraft(next); onSave(next); showToast("Aluno removido da turma");
  }

  const tabs = [
    { value: "pessoal",    label: "Dados pessoais" },
    { value: "familia",    label: "Família & responsáveis", disabled: isNew },
    { value: "saude",      label: "Ficha médica",           disabled: isNew },
    { value: "documentos", label: "Documentos",             disabled: isNew },
    { value: "matricula",  label: "Matrícula & turmas",     disabled: isNew },
  ];

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="detail-head">
        <button className="back" onClick={onBack} title="Voltar"><I.ArrowLeft size={16} /></button>
        <div className="ttl">
          <h1>{isNew ? "Novo aluno" : (draft.name || "—")}</h1>
          {!isNew && (
            <div className="meta">
              <span>Matrícula: <span className="mono">{draft.code}</span></span>
              <span>·</span>
              <Badge variant={draft.status === "active" ? "success" : "outline"}>{STATUS_LABELS[draft.status]}</Badge>
            </div>
          )}
        </div>
        {!isNew && <div className="actions"><Button variant="outline" size="sm">Ver boletim</Button></div>}
      </div>

      <Tabs value={tab} onChange={setTab} tabs={tabs} />
      <div style={{ paddingTop: 18 }}>
        {tab === "pessoal"    && <PessoalTab    s={draft} onChange={patch} onPhotoChange={handlePhoto} onSave={savePersonal} />}
        {tab === "familia"    && <FamiliaTab    s={draft} onChange={patch} onSave={saveFamilia} onAddGuardian={addGuardian} onRemoveGuardian={removeGuardian} />}
        {tab === "saude"      && <SaudeTab      s={draft} onChange={patch} onSave={saveMedical} />}
        {tab === "documentos" && <DocumentosTab s={draft} onUpload={uploadDoc} onRemove={removeDoc} />}
        {tab === "matricula"  && <MatriculaTab  s={draft} onChange={(p) => { patch(p); onSave({ ...draft, ...p }); showToast("Situação atualizada"); }} allClasses={allClasses} onAddClass={addToClass} onRemoveClass={removeFromClass} />}
      </div>
    </div>
  );
}

window.AlunoDetailScreen = AlunoDetailScreen;
