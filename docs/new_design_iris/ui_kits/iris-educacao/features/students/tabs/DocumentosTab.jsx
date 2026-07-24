/* global React, I, Button, Select, SectionCard, DOC_TYPES, DOC_LABELS, fileSizeKB */
// Tab 4 — Documents upload + list.

function DocumentosTab({ s, onUpload, onRemove }) {
  const [docType, setDocType] = React.useState("outros");
  const fileRef = React.useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload({
      id: "d" + Math.random().toString(36).slice(2, 7),
      name: file.name,
      type: docType,
      fileSize: file.size,
      uploadedAt: new Date().toLocaleDateString("pt-BR"),
    });
    e.target.value = "";
  }

  return (
    <SectionCard
      title="Documentos & anexos"
      action={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 200 }}>
            <Select value={docType} onChange={setDocType} options={DOC_TYPES} />
          </div>
          <Button size="sm" variant="outline" icon={I.Upload} onClick={() => fileRef.current?.click()}>Anexar</Button>
          <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
      }
    >
      {(!s.documents || s.documents.length === 0) && (
        <div style={{ padding: "20px 0", textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>
          Nenhum documento anexado. Selecione um tipo e clique em Anexar.
        </div>
      )}
      {(s.documents || []).map((d) => (
        <div className="doc-row" key={d.id}>
          <div className="info">
            <div className="ico"><I.FileText size={16} /></div>
            <div>
              <div className="nm">{d.name}</div>
              <div className="ds">{DOC_LABELS[d.type] || d.type} · {fileSizeKB(d.fileSize)} · enviado em {d.uploadedAt}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <Button variant="ghost" size="sm">Ver</Button>
            <button
              className="btn ghost icon"
              onClick={() => onRemove(d.id)}
              style={{ color: "var(--iris-danger-600)" }}
              title="Remover"
            >
              <I.Trash size={14} />
            </button>
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

window.DocumentosTab = DocumentosTab;
