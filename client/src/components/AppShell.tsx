import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell, Boxes, ChartNoAxesCombined, ClipboardList, LayoutDashboard,
  LogOut, Menu, PackageSearch, Search, ShieldCheck, X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

const navigation = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Boxes },
  { href: "/ocorrencias", label: "Divergências", icon: ClipboardList },
  { href: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
];

const titles: Record<string, { title: string; detail: string }> = {
  "/": { title: "Visão geral", detail: "Resumo operacional do seu estoque" },
  "/produtos": { title: "Produtos", detail: "Catálogo e quantidades cadastradas" },
  "/ocorrencias": { title: "Divergências", detail: "Acompanhe cada ocorrência do registro à resolução" },
  "/relatorios": { title: "Relatórios", detail: "Consolide e compartilhe os resultados da conferência" },
};

export function AppShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const [path] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const logout = trpc.inventory.session.logout.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      window.location.assign("/login");
    },
  });
  const page = titles[path] ?? titles["/"];
  const initials = userName.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");

  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-scrim" aria-label="Fechar navegação" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar${menuOpen ? " sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <span className="brand-mark"><PackageSearch size={21} strokeWidth={2.2} /></span>
          <span className="brand-copy"><strong>StockControl</strong><small>INVENTÁRIO & OPERAÇÕES</small></span>
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <div className="workspace-card">
          <span className="workspace-avatar"><Boxes size={16} /></span>
          <span><strong>Operação central</strong><small>Unidade principal</small></span>
          <span className="online-dot" />
        </div>
        <nav className="side-nav" aria-label="Navegação principal">
          <p className="nav-section-label">GESTÃO</p>
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link${(path === href || (href === "/ocorrencias" && path.startsWith("/ocorrencias/"))) ? " nav-link-active" : ""}`} onClick={() => setMenuOpen(false)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {href === "/ocorrencias" && <span className="nav-link-indicator" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="security-note"><ShieldCheck size={17} /><span>Ambiente protegido<small>Acesso administrativo</small></span></div>
          <button className="logout-button" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <LogOut size={17} /><span>{logout.isPending ? "Saindo…" : "Encerrar sessão"}</span>
          </button>
          <div className="sidebar-footer">PIT II <span>•</span> SITUAÇÃO-PROBLEMA 2</div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button>
          <div className="topbar-breadcrumb"><span>Operações</span><span className="crumb-slash">/</span><strong>{page.title}</strong></div>
          <div className="topbar-actions">
            <div className="global-search-hint"><Search size={16} /><span>Controle de estoque</span><kbd>⌘ K</kbd></div>
            <button className="icon-button notification-button" aria-label="Notificações"><Bell size={18} /><i /></button>
            <div className="user-chip"><span className="user-avatar">{initials || "AD"}</span><span className="user-chip-copy"><strong>{userName}</strong><small>Administrador</small></span></div>
          </div>
        </header>
        <main className="page-content">
          <div className="page-heading"><div><span className="eyebrow">PAINEL ADMINISTRATIVO</span><h1>{page.title}</h1><p>{page.detail}</p></div><div className="today-label"><span className="today-dot" /> Sistema atualizado</div></div>
          {children}
          <footer className="page-footer"><span>StockControl <span className="footer-divider">/</span> Sistema de controle de divergências</span><span>Dados demonstrativos fictícios <i>•</i> 2026</span></footer>
        </main>
      </div>
    </div>
  );
}
