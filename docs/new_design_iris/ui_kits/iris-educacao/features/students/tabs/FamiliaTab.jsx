/* global React, I, Button, Badge, Field, Input, Checkbox, Avatar, SectionCard */
// Tab 2 — Family / address / guardians.

function FamiliaTab({ s, onChange, onSave, onAddGuardian, onRemoveGuardian }) {
  const [showForm, setShowForm] = React.useState(false);
  const empty = { name: "", relationship: "", cpf: "", phone: "", profession: "", email: "", isResponsible: false, isAuthorizedPickup: false };
  const [draft, setDraft] = React.useState(empty);

  function submitGuardian(e) {
    e.preventDefault();
    if (!draft.name || !draft.relationship) return;
    onAddGuardian(draft);
    setDraft(empty);
    setShowForm(false);
  }

  return (
    <div className="stack-4">
      <SectionCard title="Dados familiares">
        <div className="form-grid-2">
          <Field label={<>Nome da mãe<span className="optional">opcional</span></>}><Input value={s.motherName} onChange={(e) => onChange({ motherName: e.target.value })} /></Field>
          <Field label={<>Telefone da mãe<span className="optional">opcional</span></>}><Input placeholder="(00) 00000-0000" value={s.motherPhone} onChange={(e) => onChange({ motherPhone: e.target.value })} /></Field>
          <div className="span-2"><Field label={<>Nome do pai<span className="optional">opcional</span></>}><Input value={s.fatherName} onChange={(e) => onChange({ fatherName: e.target.value })} /></Field></div>
        </div>
      </SectionCard>

      <SectionCard title="Endereço">
        <div className="form-grid-3">
          <Field label={<>CEP<span className="optional">opcional</span></>}><Input placeholder="00000-000" value={s.addressCep} onChange={(e) => onChange({ addressCep: e.target.value })} /></Field>
          <div className="span-2"><Field label={<>Logradouro<span className="optional">opcional</span></>}><Input placeholder="Rua, Avenida…" value={s.addressStreet} onChange={(e) => onChange({ addressStreet: e.target.value })} /></Field></div>
          <Field label={<>Número<span className="optional">opcional</span></>}><Input value={s.addressNumber} onChange={(e) => onChange({ addressNumber: e.target.value })} /></Field>
          <Field label={<>Complemento<span className="optional">opcional</span></>}><Input placeholder="Apto, Bloco…" value={s.addressComplement} onChange={(e) => onChange({ addressComplement: e.target.value })} /></Field>
          <Field label={<>Bairro<span className="optional">opcional</span></>}><Input value={s.addressNeighborhood} onChange={(e) => onChange({ addressNeighborhood: e.target.value })} /></Field>
          <div className="span-2"><Field label={<>Cidade<span className="optional">opcional</span></>}><Input value={s.addressCity} onChange={(e) => onChange({ addressCity: e.target.value })} /></Field></div>
          <Field label={<>UF<span className="optional">opcional</span></>}><Input maxLength={2} placeholder="SP" value={s.addressState} onChange={(e) => onChange({ addressState: e.target.value.toUpperCase() })} /></Field>
        </div>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onSave}>Salvar família & endereço</Button>
      </div>

      <SectionCard
        title="Responsáveis & autorizados a buscar"
        action={<Button size="sm" variant="outline" icon={I.Plus} onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancelar" : "Adicionar"}</Button>}
      >
        {showForm && (
          <form className="inline-form" onSubmit={submitGuardian}>
            <div className="h">Novo responsável / autorizado</div>
            <div className="form-grid-2">
              <div className="span-2"><Field label={<>Nome completo <span style={{ color: "var(--iris-blue-700)" }}>*</span></>}><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field></div>
              <Field label={<>Parentesco <span style={{ color: "var(--iris-blue-700)" }}>*</span></>}><Input placeholder="Pai, Mãe, Avó…" value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} /></Field>
              <Field label={<>CPF<span className="optional">opcional</span></>}><Input placeholder="000.000.000-00" value={draft.cpf} onChange={(e) => setDraft({ ...draft, cpf: e.target.value })} /></Field>
              <Field label={<>Telefone<span className="optional">opcional</span></>}><Input placeholder="(00) 00000-0000" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
              <Field label={<>Profissão<span className="optional">opcional</span></>}><Input value={draft.profession} onChange={(e) => setDraft({ ...draft, profession: e.target.value })} /></Field>
              <div className="span-2"><Field label={<>E-mail<span className="optional">opcional</span></>}><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field></div>
              <Checkbox checked={draft.isResponsible}      onChange={(v) => setDraft({ ...draft, isResponsible: v })}      label="Responsável legal" />
              <Checkbox checked={draft.isAuthorizedPickup} onChange={(v) => setDraft({ ...draft, isAuthorizedPickup: v })} label="Autorizado a buscar" />
            </div>
            <div className="actions">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm">Adicionar</Button>
            </div>
          </form>
        )}

        {(!s.guardians || s.guardians.length === 0) && !showForm && (
          <div style={{ padding: "16px 0", textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>
            Nenhum responsável cadastrado.
          </div>
        )}

        {(s.guardians || []).map((g) => (
          <div className="guardian-row" key={g.id}>
            <div className="left">
              <Avatar name={g.name} size={36} />
              <div style={{ minWidth: 0 }}>
                <div className="nm">{g.name}</div>
                <div className="meta">{g.relationship}{g.phone ? ` · ${g.phone}` : ""}{g.cpf ? ` · CPF: ${g.cpf}` : ""}</div>
                <div className="tags">
                  {g.isResponsible       && <Badge variant="info">Responsável</Badge>}
                  {g.isAuthorizedPickup  && <Badge variant="outline">Autorizado a buscar</Badge>}
                </div>
              </div>
            </div>
            <button className="btn ghost icon" onClick={() => onRemoveGuardian(g.id)} style={{ color: "var(--iris-danger-600)" }} title="Remover">
              <I.Trash size={14} />
            </button>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

window.FamiliaTab = FamiliaTab;
