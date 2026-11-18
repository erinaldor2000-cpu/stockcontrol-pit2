import { lazy, Suspense, useEffect } from "react";
import { Router, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppShell } from "./components/AppShell";
import { trpc } from "@/lib/trpc";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const OccurrencesPage = lazy(() => import("./pages/OccurrencesPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

function LoadingScreen() {
  return <main className="session-loading"><span className="session-loading-mark"><span className="brand-mark"><i /></span></span><strong>StockControl</strong><span>Verificando seu acesso…</span></main>;
}

function SessionRouter() {
  const [path, navigate] = useLocation();
  const session = trpc.inventory.session.me.useQuery(undefined, { retry: false, staleTime: 30_000 });
  const pathname = path.split("?")[0];

  useEffect(() => {
    if (session.data && pathname === "/login") navigate("/");
  }, [session.data, pathname, navigate]);

  if (session.isLoading) return <LoadingScreen />;
  if (!session.data) return <Suspense fallback={<LoadingScreen />}><LoginPage /></Suspense>;

  let page: React.ReactNode;
  if (pathname === "/" || pathname === "/login") page = <DashboardPage />;
  else if (pathname === "/produtos") page = <ProductsPage />;
  else if (pathname === "/ocorrencias" || /^\/ocorrencias\/\d+$/.test(pathname)) page = <OccurrencesPage />;
  else if (pathname === "/relatorios") page = <ReportsPage />;
  else page = <main className="not-found-panel"><span className="eyebrow">PÁGINA NÃO ENCONTRADA</span><h1>Não encontramos essa área.</h1><p>Volte ao painel administrativo para continuar.</p><a href="/" className="button button-primary">Voltar à visão geral</a></main>;

  return <AppShell userName={session.data.nome}><Suspense fallback={<div className="content-skeleton"><div /><div /><div /></div>}>{page}</Suspense></AppShell>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router><SessionRouter /></Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
