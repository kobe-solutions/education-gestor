/* global */
// Selects + label maps used across the Aluno detail tabs.

const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((t) => ({ value: t, label: t }));
const SEX_OPTS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "outro", label: "Outro" },
];
const STATUS_OPTS = [
  { value: "active",      label: "Ativo" },
  { value: "inactive",    label: "Inativo" },
  { value: "transferred", label: "Transferido" },
  { value: "cancelled",   label: "Cancelado" },
];
const DOC_TYPES = [
  { value: "historico",  label: "Histórico Escolar" },
  { value: "boletim",    label: "Boletim de Notas" },
  { value: "identidade", label: "Documento de Identidade" },
  { value: "outros",     label: "Outros" },
];
const STATUS_LABELS = STATUS_OPTS.reduce((a, o) => (a[o.value] = o.label, a), {});
const DOC_LABELS    = DOC_TYPES.reduce((a, o)    => (a[o.value] = o.label, a), {});

Object.assign(window, { BLOOD_TYPES, SEX_OPTS, STATUS_OPTS, DOC_TYPES, STATUS_LABELS, DOC_LABELS });
