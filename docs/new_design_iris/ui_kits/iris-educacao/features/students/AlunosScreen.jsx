/* global React, I, Button, Search, Surface, PageHead, Badge */

const STATUS_LABELS = { active: "Ativo", inactive: "Inativo", transferred: "Transferido" };

function AlunosScreen({ data, onBack, onOpen, onCreate }) {
  const [q, setQ] = React.useState("");
  const filtered = data.students.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="stack-4">
      <PageHead
        title="Alunos"
        subtitle={`${data.students.length} alunos cadastrados`}
        actions={<>
          <Button variant="ghost" size="sm" onClick={onBack}>Voltar</Button>
          <Button icon={I.Plus} size="sm" onClick={onCreate}>Novo aluno</Button>
        </>}
      />

      <div style={{ maxWidth: 360 }}>
        <Search value={q} onChange={setQ} placeholder="Buscar por nome ou matrícula…" />
      </div>

      <Surface>
        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Matrícula</th>
              <th>Turma</th>
              <th>Responsável</th>
              <th>Situação</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} onClick={() => onOpen(s.id)}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td className="mono">{s.code}</td>
                <td>{s.cls}</td>
                <td>{s.guardian}</td>
                <td>
                  <Badge variant={s.status === "active" ? "success" : "outline"}>
                    {STATUS_LABELS[s.status] || s.status}
                  </Badge>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="row-actions">
                    <button className="btn ghost icon" title="Editar" onClick={() => onOpen(s.id)}><I.Pencil size={14} /></button>
                    <button className="btn ghost icon" title="Excluir" style={{ color: "var(--iris-danger-600)" }}><I.Trash size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: 32, color: "var(--fg-3)", fontSize: 12 }}>Nenhum aluno encontrado para "{q}".</td></tr>
            )}
          </tbody>
        </table>
      </Surface>
    </div>
  );
}

window.AlunosScreen = AlunosScreen;
