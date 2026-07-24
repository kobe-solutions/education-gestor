/* global React, I, Button, MetricCard, PageHead, Surface, TuitionStatusBadge, fmtBRL */

function DashboardScreen({ onNavigate, data }) {
  const t = data.tuitionsSummary;
  return (
    <div className="stack-6">
      <PageHead
        title="Dashboard"
        subtitle="Visão geral da escola — ano letivo 2026"
        actions={<Button variant="outline" size="sm">Exportar relatório</Button>}
      />

      <div className="grid-6">
        <MetricCard icon={I.Users}         label="Alunos"      value={data.studentsCount}   color="#185FA5" />
        <MetricCard icon={I.GraduationCap} label="Professores" value={data.teachersCount}   color="#378ADD" />
        <MetricCard icon={I.BookOpen}      label="Turmas"      value={data.classesCount}    color="#042C53" />
        <MetricCard icon={I.Clock}         label="Pendentes"   value={t.pending.count} sub={fmtBRL(t.pending.total)} color="#B45309" />
        <MetricCard icon={I.CheckCircle}   label="Pagas"       value={t.paid.count}    sub={fmtBRL(t.paid.total)}    color="#15803D" />
        <MetricCard icon={I.Alert}         label="Atrasadas"   value={t.overdue.count} sub={fmtBRL(t.overdue.total)} color="#B91C1C" />
      </div>

      <div className="stack-3">
        <div className="row-between">
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Mensalidades vencendo nos próximos 7 dias</h2>
            <div className="muted" style={{ fontSize: 12 }}>Acompanhe alunos com vencimento próximo.</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate("financial")}>Ver todas</Button>
        </div>
        <Surface>
          <table className="tbl">
            <thead>
              <tr><th>Aluno</th><th>Turma</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.upcomingTuitions.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.student}</td>
                  <td>{row.cls}</td>
                  <td>{row.due}</td>
                  <td>{fmtBRL(row.amount)}</td>
                  <td><TuitionStatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
