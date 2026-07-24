/* global React, Button, Field, Textarea, SectionCard */
// Tab 3 — Medical chart.

const MEDICAL_FIELDS = [
  { k: "allergies",        label: "Alergias",                       ph: "Ex.: penicilina, amendoim…" },
  { k: "medications",      label: "Uso contínuo de medicamentos",   ph: "Nome, dosagem e frequência…" },
  { k: "foodRestrictions", label: "Restrições alimentares",         ph: "Ex.: lactose, glúten…" },
  { k: "diseases",         label: "Doenças importantes",            ph: "Ex.: asma, epilepsia…" },
  { k: "medicalContact",   label: "Contato médico",                 ph: "Nome do médico e telefone…" },
];

function SaudeTab({ s, onChange, onSave }) {
  return (
    <div className="stack-4">
      <SectionCard title="Ficha médica">
        <div className="stack-4">
          {MEDICAL_FIELDS.map((f) => (
            <Field key={f.k} label={<>{f.label}<span className="optional">opcional</span></>}>
              <Textarea value={s[f.k]} onChange={(v) => onChange({ [f.k]: v })} placeholder={f.ph} />
            </Field>
          ))}
        </div>
      </SectionCard>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onSave}>Salvar ficha médica</Button>
      </div>
    </div>
  );
}

window.SaudeTab = SaudeTab;
