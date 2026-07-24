/* global React, I, Button, Search, Surface, PageHead, TuitionStatusBadge, Dialog, Field, Input, fmtBRL, Toast */

function MensalidadesScreen({ data, onPay, onCreate, toast }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [confirm, setConfirm] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({ student: "", amount: "", due: "" });

  const filtered = data.tuitions.filter((t) => {
    const ok = !q || t.student.toLowerCase().includes(q.toLowerCase());
    const okStatus = status === "all" || t.status === status;
    return ok && okStatus;
  });

  return (
    <div className="stack-4">
      <PageHead
        title="Mensalidades"
        subtitle={`${filtered.length} cobranças encontradas`}
        actions={<Button icon={I.Plus} size="sm" onClick={() => setCreating(true)}>Nova mensalidade</Button>}
      />

      <div className="row-2">
        <div style={{ width: 280 }}><Search value={q} onChange={setQ} placeholder="Buscar aluno…" /></div>
        <select className="input" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
        </select>
      </div>

      <Surface>
        <table className="tbl">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th style={{ width: 180 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.student}</td>
                <td>{t.due}</td>
                <td>{fmtBRL(t.amount)}</td>
                <td><TuitionStatusBadge status={t.status} /></td>
                <td>
                  {t.status !== "paid" && (
                    <div className="row-actions">
                      <Button variant="outline" size="sm" onClick={() => setConfirm(t)}>Registrar pagamento</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>

      <Dialog
        open={!!confirm}
        title="Confirmar pagamento"
        description="Esta ação registra a baixa da mensalidade na escola."
        onClose={() => setConfirm(null)}
        footer={<>
          <Button variant="outline" size="sm" onClick={() => setConfirm(null)}>Cancelar</Button>
          <Button size="sm" onClick={() => { onPay(confirm.id); setConfirm(null); }}>Confirmar</Button>
        </>}
      >
        <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
          Registrar pagamento de <b>{confirm ? fmtBRL(confirm.amount) : ""}</b> de <b>{confirm ? confirm.student : ""}</b>?
        </div>
      </Dialog>

      <Dialog
        open={creating}
        title="Nova mensalidade"
        description="Cadastre o vencimento e o valor — o boleto é gerado em seguida."
        onClose={() => setCreating(false)}
        footer={<>
          <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancelar</Button>
          <Button size="sm" onClick={() => { onCreate(form); setCreating(false); setForm({ student: "", amount: "", due: "" }); }}>Salvar</Button>
        </>}
      >
        <Field label="Aluno"><Input placeholder="Selecione o aluno" value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} /></Field>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="Valor (R$)"><Input placeholder="980,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Vencimento"><Input placeholder="10/06/2026" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field></div>
        </div>
      </Dialog>

      <Toast message={toast.message} kind={toast.kind} />
    </div>
  );
}

window.MensalidadesScreen = MensalidadesScreen;
