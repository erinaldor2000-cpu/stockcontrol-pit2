import { useState, type FormEvent } from "react";
import { ArrowRight, Boxes, CircleCheck, LockKeyhole, PackageCheck, PackageSearch, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { friendlyError } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [login, setLogin] = useState("admin");
  const [senha, setSenha] = useState("123456");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const mutation = trpc.inventory.session.login.useMutation({
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries();
      navigate("/");
    },
    onError: error => setError(friendlyError(error, "Não foi possível entrar. Confira seus dados.")),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    mutation.mutate({ login, senha });
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="brand-mark"><PackageSearch size={22} strokeWidth={2.2} /></span>
          <span><strong>StockControl</strong><small>INVENTÁRIO & OPERAÇÕES</small></span>
        </div>
        <div className="login-story">
          <span className="login-overline"><i /> CONTROLE OPERACIONAL</span>
          <h1>Estoque certo.<br /><em>Decisões melhores.</em></h1>
          <p>Encontre diferenças, acompanhe cada conferência e mantenha sua operação em movimento.</p>
          <div className="story-card">
            <div className="story-card-heading"><span><Boxes size={17} /> RESUMO DO INVENTÁRIO</span><span className="story-live"><i /> ATUALIZADO</span></div>
            <div className="story-stat"><div><strong>04</strong><small>divergências registradas</small></div><div className="story-mini-bars"><i /><i /><i /><i /><i /><i /><i /></div></div>
            <div className="story-statuses"><span><i className="status-dot status-dot-pending" /> Pendentes <b>02</b></span><span><i className="status-dot status-dot-review" /> Em análise <b>01</b></span><span><i className="status-dot status-dot-done" /> Resolvidas <b>01</b></span></div>
          </div>
        </div>
        <div className="login-panel-footer"><span><ShieldCheck size={15} /> Acesso seguro para sua equipe</span><span>PIT II · Situação-Problema 2</span></div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-mark"><span className="brand-mark"><PackageSearch size={22} /></span><strong>StockControl</strong></div>
          <div className="login-welcome-icon"><PackageCheck size={23} /></div>
          <span className="eyebrow">ÁREA ADMINISTRATIVA</span>
          <h2>Acesse sua conta</h2>
          <p className="login-subtitle">Entre para acompanhar a saúde do seu inventário.</p>
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login">Usuário</label>
            <div className="input-with-icon"><span className="input-leading">@</span><input id="login" name="login" autoComplete="username" value={login} onChange={event => setLogin(event.target.value)} placeholder="Digite seu usuário" required /></div>
            <div className="password-label-row"><label htmlFor="senha">Senha</label><span>Credencial de demonstração</span></div>
            <div className="input-with-icon"><LockKeyhole size={16} className="input-leading-svg" /><input id="senha" name="senha" type="password" autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} placeholder="Digite sua senha" required /></div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary login-submit" type="submit" disabled={mutation.isPending}>{mutation.isPending ? <><span className="button-spinner" /> Validando acesso…</> : <>Entrar no sistema <ArrowRight size={17} /></>}</button>
          </form>
          <div className="demo-credential"><div className="demo-check"><CircleCheck size={17} /></div><div><strong>Acesso para apresentação</strong><p>Usuário <b>admin</b><span>·</span> Senha <b>123456</b></p></div></div>
          <div className="login-security"><LockKeyhole size={14} /> Seus dados de acesso são protegidos por sessão segura.</div>
        </div>
        <footer className="login-mobile-footer">PIT II · Situação-Problema 2 <span>•</span> Dados fictícios</footer>
      </section>
    </main>
  );
}
