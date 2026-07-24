/* global React, I, Button, Input, Field, Toast */

function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState("diretor@colegio-sagrado.com.br");
  const [password, setPassword] = React.useState("••••••••");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  function submit(e) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("E-mail inválido."); return; }
    if (!password) { setError("Senha obrigatória."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 600);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand">
          <img src="../../assets/logos/iris-vertical.svg" alt="IRIS Educação" />
        </div>
        <h2>Bem-vindo de volta</h2>
        <div className="tagline">Acesse a gestão escolar do Colégio Sagrado Coração</div>
        <form onSubmit={submit}>
          <Field label="E-mail">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@escola.com" />
          </Field>
          <Field label="Senha" error={error || undefined}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <div className="demo-hint">Clique em <b>Entrar</b> para explorar a demo.</div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
