/* global React, I, Button, Field, Input, Textarea, Select, BLOOD_TYPES, SEX_OPTS */
// Tab 1 — Personal data (with photo upload).

function PessoalTab({ s, onChange, onPhotoChange, onSave }) {
  const photoRef = React.useRef(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28 }}>
      <div className="photo-uploader-wrap">
        <div className="photo-uploader" onClick={() => photoRef.current?.click()}>
          {s.photoUrl
            ? <img src={s.photoUrl} alt="foto" />
            : <I.UserCircle size={70} />}
        </div>
        <Button variant="outline" size="sm" icon={I.Upload} onClick={() => photoRef.current?.click()}>
          {s.photoUrl ? "Trocar foto 3x4" : "Enviar foto 3x4"}
        </Button>
        <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhotoChange} />
        <div className="photo-hint">PNG ou JPG até 5 MB. Formato 3×4 recomendado.</div>
      </div>

      <form className="stack-4" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        <div className="form-grid-2">
          <div className="span-2"><Field label={<>Nome completo <span style={{ color: "var(--iris-blue-700)" }}>*</span></>}><Input value={s.name} onChange={(e) => onChange({ name: e.target.value })} /></Field></div>
          <Field label={<>CPF<span className="optional">opcional</span></>}><Input placeholder="000.000.000-00" value={s.cpf} onChange={(e) => onChange({ cpf: e.target.value })} /></Field>
          <Field label={<>RG<span className="optional">opcional</span></>}><Input placeholder="00.000.000-0" value={s.rg} onChange={(e) => onChange({ rg: e.target.value })} /></Field>
          <Field label={<>Data de nascimento<span className="optional">opcional</span></>}><Input type="date" value={s.birthDate} onChange={(e) => onChange({ birthDate: e.target.value })} /></Field>
          <Field label={<>Sexo<span className="optional">opcional</span></>}><Select value={s.sex} onChange={(v) => onChange({ sex: v })} options={SEX_OPTS} placeholder="Selecionar" /></Field>
          <Field label={<>Tipo sanguíneo<span className="optional">opcional</span></>}><Select value={s.bloodType} onChange={(v) => onChange({ bloodType: v })} options={BLOOD_TYPES} placeholder="Selecionar" /></Field>
          <Field label={<>Naturalidade<span className="optional">opcional</span></>}><Input placeholder="Cidade / UF" value={s.naturalidade} onChange={(e) => onChange({ naturalidade: e.target.value })} /></Field>
          <Field label={<>Telefone<span className="optional">opcional</span></>}><Input placeholder="(00) 00000-0000" value={s.phone} onChange={(e) => onChange({ phone: e.target.value })} /></Field>
          <div className="span-2"><Field label={<>E-mail<span className="optional">opcional</span></>}><Input type="email" value={s.email} onChange={(e) => onChange({ email: e.target.value })} /></Field></div>
          <div className="span-2"><Field label={<>Comorbidades<span className="optional">opcional</span></>}><Input placeholder="Ex.: hipertensão, diabetes…" value={s.comorbidities} onChange={(e) => onChange({ comorbidities: e.target.value })} /></Field></div>
          <div className="span-2"><Field label={<>Observações<span className="optional">opcional</span></>}><Textarea value={s.observations} onChange={(v) => onChange({ observations: v })} placeholder="Observações gerais sobre o aluno…" rows={3} /></Field></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="submit">Salvar dados pessoais</Button>
        </div>
      </form>
    </div>
  );
}

window.PessoalTab = PessoalTab;
