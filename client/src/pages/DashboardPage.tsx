import { Link } from "wouter";
import { Activity, ArrowRight, ArrowUpRight, ClipboardCheck, ClipboardList, Package, Plus, RotateCw, ScanSearch, TriangleAlert } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";

const statusColors: Record<string, string> = { Pendente: "#e5a647", "Em análise": "#4b82da", Resolvido: "#34a47e" };

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = trpc.inventory.dashboard.useQuery();
  const summary = data ?? { total: 0, pendentes: 0, emAnalise: 0, resolvidas: 0, produtos: 0, diferencasUnidades: 0, recentes: [] };
  const chartData = [
    { name: "Pendente", value: summary.pendentes },
    { name: "Em análise", value: summary.emAnalise },
    { name: "Resolvido", value: summary.resolvidas },
  ];
  const metrics = [
    { label: "Total de ocorrências", value: summary.total, icon: ClipboardList, tone: "blue", note: "Em todo o período" },
    { label: "Pendentes", value: summary.pendentes, icon: TriangleAlert, tone: "amber", note: "Aguardam conferência" },
    { label: "Em análise", value: summary.emAnalise, icon: ScanSearch, tone: "violet", note: "Em acompanhamento" },
    { label: "Resolvidas", value: summary.resolvidas, icon: ClipboardCheck, tone: "green", note: "Conferência concluída" },
  ];

  if (isLoading) return <div className="content-skeleton"><div /><div /><div /></div>;
  if (isError) return <div className="error-panel"><p>Não foi possível carregar o resumo do estoque.</p><button className="button button-secondary" onClick={() => refetch()}><RotateCw size={15} /> Tentar novamente</button></div>;

  return (
    <div className="dashboard-page">
      <section className="metric-grid" aria-label="Indicadores do estoque">
        {metrics.map(({ label, value, icon: Icon, tone, note }) => (
          <article className="metric-card" key={label}>
            <div className={`metric-icon metric-${tone}`}><Icon size={19} strokeWidth={1.9} /></div>
            <div className="metric-label-row"><span>{label}</span><span className="metric-menu">•••</span></div>
            <div className="metric-value-row"><strong>{value.toString().padStart(2, "0")}</strong><span className={`metric-indicator metric-indicator-${tone}`}><ArrowUpRight size={14} /></span></div>
            <p className="metric-note">{note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <article className="panel status-panel">
          <div className="panel-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Ocorrências por status</h2><p>Visão geral do andamento das conferências</p></div><button className="icon-button panel-refresh" title="Atualizar dados" onClick={() => refetch()} disabled={isFetching}><RotateCw size={16} className={isFetching ? "spin" : ""} /></button></div>
          <div className="status-chart-layout">
            <div className="donut-wrap">
              {summary.total ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={98} paddingAngle={4} stroke="none">{chartData.map(item => <Cell key={item.name} fill={statusColors[item.name]} />)}</Pie><Tooltip formatter={(value) => [`${value} ocorrência(s)`, "Quantidade"]} contentStyle={{ borderRadius: 12, border: "1px solid #e8edf4", boxShadow: "0 12px 32px #11243b12" }} /></PieChart></ResponsiveContainer> : <div className="donut-empty" />}
              <div className="donut-center"><strong>{summary.total.toString().padStart(2, "0")}</strong><span>REGISTROS</span></div>
            </div>
            <div className="chart-legend">
              {chartData.map(item => <div className="legend-item" key={item.name}><span className="legend-dot" style={{ background: statusColors[item.name] }} /><span>{item.name}</span><strong>{item.value.toString().padStart(2, "0")}</strong></div>)}
              <div className="chart-insight"><Activity size={15} /><span><strong>{summary.diferencasUnidades}</strong> unidade(s) em diferença absoluta</span></div>
            </div>
          </div>
        </article>

        <article className="panel inventory-panel">
          <div className="panel-heading"><div><span className="eyebrow">RESUMO GERAL</span><h2>Visão do inventário</h2><p>Indicadores atuais da unidade</p></div><span className="inventory-badge"><i /> Ativo</span></div>
          <div className="inventory-summary-stat"><span className="inventory-stat-icon"><Package size={18} /></span><div><strong>{summary.produtos}</strong><span>produtos cadastrados</span></div><span className="summary-caption">CATÁLOGO</span></div>
          <div className="inventory-summary-stat"><span className="inventory-stat-icon inventory-stat-warning"><TriangleAlert size={18} /></span><div><strong>{summary.pendentes + summary.emAnalise}</strong><span>itens em acompanhamento</span></div><span className="summary-caption">ABERTOS</span></div>
          <div className="inventory-callout"><span className="callout-symbol"><ScanSearch size={16} /></span><p><strong>Priorize as pendências</strong><br />Confira os itens ainda sem resolução para manter os saldos atualizados.</p></div>
          <Link href="/ocorrencias?status=Pendente" className="text-action">Ver divergências abertas <ArrowRight size={15} /></Link>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading recent-heading"><div><span className="eyebrow">ATIVIDADE RECENTE</span><h2>Últimas divergências</h2><p>Acompanhe as ocorrências mais recentes do inventário</p></div><Link href="/ocorrencias" className="button button-secondary">Todas as ocorrências <ArrowRight size={15} /></Link></div>
        {summary.recentes.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>PRODUTO</th><th>DATA DA OCORRÊNCIA</th><th>QUANTIDADE</th><th>DIFERENÇA</th><th>STATUS</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
          {summary.recentes.map(item => <tr key={item.id}>
            <td><div className="product-cell"><span className="product-mini-icon"><Package size={16} /></span><span><strong>{item.produtoNome}</strong><small>{item.produtoCodigo}</small></span></div></td>
            <td>{formatDate(item.dataOcorrencia)}</td>
            <td><span className="quantity-inline">{item.quantidadeSistema}<small> sistema</small><span>→</span>{item.quantidadeFisica}<small> físico</small></span></td>
            <td><span className={`difference-tag${Number(item.diferenca) ? " difference-negative" : " difference-zero"}`}>{Number(item.diferenca) > 0 ? "+" : ""}{item.diferenca} un.</span></td>
            <td><StatusBadge status={item.status} /></td>
            <td><Link href={`/ocorrencias/${item.id}`} className="table-arrow" aria-label={`Ver ${item.produtoNome}`}><ArrowRight size={16} /></Link></td>
          </tr>)}
        </tbody></table></div> : <div className="empty-state"><ClipboardCheck size={25} /><strong>Nenhuma ocorrência registrada</strong><span>Cadastre uma divergência para acompanhar o inventário.</span><Link href="/ocorrencias" className="button button-primary"><Plus size={15} /> Registrar ocorrência</Link></div>}
      </section>

      <div className="dashboard-bottom-note"><span><i /> Dados sincronizados com o banco de dados</span><span>Atualização automática em cada alteração</span></div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const className = status === "Resolvido" ? "status-resolved" : status === "Em análise" ? "status-review" : "status-pending";
  return <span className={`status-badge ${className}`}><i />{status}</span>;
}
