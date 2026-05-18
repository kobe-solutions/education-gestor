/* global React, I, HubCard, PageHead */
// Acadêmico hub — central place for class-related operations.

function AcademicoHubScreen({ onNavigate }) {
  return (
    <div className="stack-6">
      <PageHead
        title="Acadêmico"
        subtitle="Organize a estrutura escolar, monte horários e matricule alunos em turmas"
      />
      <div className="grid-3" style={{ maxWidth: 1080 }}>
        <HubCard
          icon={I.Network}
          title="Estrutura Escolar"
          description="Hierarquia completa: nível de ensino → série → turma. Visualize e organize toda a árvore."
          onClick={() => onNavigate("estrutura")}
        />
        <HubCard
          icon={I.Calendar}
          title="Locação de Aulas"
          description="Monte a grade horária — arraste o professor para o slot da turma."
          onClick={() => onNavigate("locacao")}
        />
        <HubCard
          icon={I.UserPlus}
          title="Matrícula em Turmas"
          description="Arraste alunos para turmas e controle o limite de vagas por turma."
          onClick={() => onNavigate("matricula")}
        />
        <HubCard
          icon={I.BookOpen}
          title="Notas & Boletim"
          description="Lançamento de notas por bimestre e geração de boletins por aluno."
          onClick={() => onNavigate("notas")}
        />
        <HubCard
          icon={I.CheckCircle}
          title="Frequência"
          description="Registro diário de presença em lote ou aluno a aluno."
          onClick={() => onNavigate("frequencia")}
        />
        <HubCard
          icon={I.FileText}
          title="Disciplinas & Períodos"
          description="Catálogo de disciplinas e configuração dos períodos letivos."
          onClick={() => onNavigate("config")}
        />
      </div>
    </div>
  );
}

window.AcademicoHubScreen = AcademicoHubScreen;
