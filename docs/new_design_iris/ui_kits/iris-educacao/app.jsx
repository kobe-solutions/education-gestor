/* global React, ReactDOM, I, SEED, ALL_CLASSES,
   Sidebar, AppHeader, Toast, Button, PageHead, EmptyState,
   LoginScreen, DashboardScreen, PessoasHubScreen,
   AlunosScreen, AlunoDetailScreen, MensalidadesScreen, EstruturaScreen,
   LocacaoAulasScreen, LocacaoAlunosScreen */

// ─── Cross-cutting state hook (auth + routing + toast) ─────────────────────

function useAppState() {
  const [authed, setAuthed]   = React.useState(true);
  const [route, setRoute]     = React.useState("dashboard");
  const [data, setData]       = React.useState(SEED);
  const [toast, setToast]     = React.useState({ message: "", kind: "success" });
  const toastTimer = React.useRef(null);

  function showToast(message, kind = "success") {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ message: "", kind }), 2400);
  }

  return { authed, setAuthed, route, setRoute, data, setData, toast, showToast };
}

// ─── Feature handlers — keep each domain's mutations local to one block ────

function useFinancialHandlers({ setData, showToast }) {
  return {
    payTuition(id) {
      setData((d) => ({ ...d, tuitions: d.tuitions.map((t) => t.id === id ? { ...t, status: "paid" } : t) }));
      showToast("Pagamento registrado");
    },
    createTuition(form) {
      const id = "tn" + Math.random().toString(36).slice(2, 7);
      const student = form.student || "Novo aluno";
      const due     = form.due || "—";
      const amount  = parseFloat((form.amount || "0").replace(",", ".")) || 0;
      setData((d) => ({ ...d, tuitions: [{ id, student, due, amount, status: "pending" }, ...d.tuitions] }));
      showToast("Mensalidade criada");
    },
  };
}

function useStudentHandlers({ setData, setRoute }) {
  const [selectedStudentId, setSelectedStudentId] = React.useState(null);
  const [studentMode, setStudentMode]             = React.useState("edit");

  function openStudent(id) {
    setSelectedStudentId(id);
    setStudentMode("edit");
    setRoute("aluno");
  }
  function createStudent() {
    const id   = "ns" + Math.random().toString(36).slice(2, 6);
    const year = new Date().getFullYear();
    const code = `MAT-${year}-` + String(Math.floor(Math.random() * 90000) + 10000);
    const empty = {
      id, code, name: "", status: "active",
      cpf: "", rg: "", birthDate: "", sex: "", bloodType: "",
      naturalidade: "", phone: "", email: "", comorbidities: "", observations: "",
      motherName: "", motherPhone: "", fatherName: "",
      addressCep: "", addressStreet: "", addressNumber: "", addressComplement: "",
      addressNeighborhood: "", addressCity: "", addressState: "",
      allergies: "", medications: "", foodRestrictions: "", diseases: "", medicalContact: "",
      guardians: [], documents: [], classes: [],
      enrollmentDate: new Date().toLocaleDateString("pt-BR"), internalCode: "",
      photoUrl: null, cls: "—", guardian: "—",
    };
    setData((d) => ({ ...d, students: [empty, ...d.students] }));
    setSelectedStudentId(id);
    setStudentMode("new");
    setRoute("aluno");
  }
  function saveStudent(next) {
    setData((d) => ({
      ...d,
      students: d.students.map((s) => s.id === next.id ? {
        ...s, ...next,
        // Keep list-summary fields in sync with the detail edits
        cls:      (next.classes && next.classes[0]?.name) || s.cls,
        guardian: (next.guardians && next.guardians.find((g) => g.isResponsible)?.name) || s.guardian || "—",
      } : s),
    }));
    if (studentMode === "new") setStudentMode("edit");
  }

  return { selectedStudentId, studentMode, openStudent, createStudent, saveStudent };
}

// ─── Root component ────────────────────────────────────────────────────────

function App() {
  const { authed, setAuthed, route, setRoute, data, setData, toast, showToast } = useAppState();
  const financial = useFinancialHandlers({ setData, showToast });
  const students  = useStudentHandlers({ setData, setRoute });

  if (!authed) {
    return <LoginScreen onLogin={() => { setAuthed(true); setRoute("dashboard"); }} />;
  }

  const user   = { name: "Ana Bittencourt", initials: "AB" };
  const school = "Colégio Sagrado Coração";
  const role   = "gestor";

  const screen = renderRoute({ route, data, setRoute, financial, students, showToast });

  return (
    <div className="app-shell">
      <Sidebar active={route} onNavigate={setRoute} onLogout={() => setAuthed(false)} />
      <main className="main">
        <AppHeader role={role} school={school} user={user} />
        <div className="content">{screen}</div>
      </main>
      <Toast message={toast.message} kind={toast.kind} />
    </div>
  );
}

// ─── Routing — one map, easy to extend ─────────────────────────────────────

function renderRoute({ route, data, setRoute, financial, students, showToast }) {
  switch (route) {
    case "dashboard":
      return <DashboardScreen onNavigate={setRoute} data={data} />;

    case "pessoas":
      return <PessoasHubScreen onNavigate={setRoute} data={data} />;

    case "alunos":
      return <AlunosScreen data={data} onBack={() => setRoute("pessoas")} onOpen={students.openStudent} onCreate={students.createStudent} />;

    case "aluno": {
      const student = data.students.find((s) => s.id === students.selectedStudentId);
      return student
        ? <AlunoDetailScreen student={student} mode={students.studentMode} allClasses={ALL_CLASSES} onBack={() => setRoute("alunos")} onSave={students.saveStudent} showToast={showToast} />
        : <DashboardScreen onNavigate={setRoute} data={data} />;
    }

    case "locacao":
      return <LocacaoAulasScreen
        data={{ subjects: data.subjects, classes: data.locClasses, initialLessons: data.initialLessons }}
        onBack={() => setRoute("academico")}
        showToast={showToast}
      />;

    case "matricula":
      return <LocacaoAlunosScreen
        data={{ students: data.students, classes: data.locClasses, initialEnrolment: data.initialEnrolment }}
        onBack={() => setRoute("academico")}
        showToast={showToast}
      />;

    case "academico":
      return <window.AcademicoHubScreen onNavigate={setRoute} />;

    case "estrutura":
      return <EstruturaScreen data={data} />;

    case "financial":
      return <MensalidadesScreen data={data} onPay={financial.payTuition} onCreate={financial.createTuition} toast={{ message: "", kind: "success" }} />;

    case "professores":
      return (
        <div className="stack-4">
          <PageHead title="Professores" subtitle="Cadastro em construção na demo" actions={<Button variant="ghost" size="sm" onClick={() => setRoute("pessoas")}>Voltar</Button>} />
          <EmptyState icon={I.GraduationCap} title="Sem dados de professores na demo" description="Esta tela existe no produto real, mas foi omitida do UI kit por foco." />
        </div>
      );

    case "config":
      return (
        <div className="stack-4">
          <PageHead title="Configurações" subtitle="Disciplinas, períodos letivos e mais" />
          <EmptyState icon={I.Settings} title="Em breve no UI kit" description="Configurações é um hub navegável no produto real (Disciplinas, Períodos letivos)." />
        </div>
      );

    default:
      return <DashboardScreen onNavigate={setRoute} data={data} />;
  }
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
