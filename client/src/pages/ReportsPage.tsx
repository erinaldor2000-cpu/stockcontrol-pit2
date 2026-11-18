import { useMemo, useState } from "react";
import { Activity, ArrowDownToLine, CalendarDays, CheckCircle2, ClipboardList, FileBarChart, Printer, TriangleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { downloadCsv, formatDate } from "@/lib/format";
import { StatusBadge } from "@/pages/DashboardPage";

const reportOptions = [
  { key: "geral", title: "Relatório geral", detail: "Todas as divergências", icon: FileBarChart },
  { key: "pendentes", title: "Pendentes", detail: "Aguardando conferência", icon: TriangleAlert },
  { key: "resolvidas", title: "Resolvidas", detail: "Conferências concluídas", icon: CheckCircle2 },
] as const;
type ReportType = typeof reportOptions[number]["key"];

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>("geral");
  const reportQuery = trpc.inventory.reports.useQuery({ tipo: type });
  const rows = reportQuery.data ?? [];
  const summary = useMemo(() => ({
    total: rows.length,
    unidades: rows.reduce((sum, row) => sum + Math.abs(Number(row.diferenca)), 0),
    valor: rows.filter(row => row.status === "Resolvido").length,
  }), [rows]);
  const current = reportOptions.find(option => option.key === type)!;

  function exportCsv() {
    downloadCsv(`stockcontrol-relatorio-${type}-${new Date().toISOString().slice(0, 10)}.csv`, rows.map(row => ({
      Ocorrencia: row.id,
      Produto: row.produtoNome,
      Codigo: row.produtoCodigo,
      Data: formatDate(row.dataOcorrencia),
      QuantidadeSistema: row.quantidadeSistema,
      QuantidadeFisica: row.quantidadeFisica,
      Diferenca: row.diferenca,
      Status: row.status,
      Descricao: row.descricao,
    })));
  }

  return (
    <div className="module-page reports-page">
      <section className="report-option-grid">
        {reportOptions.map(option => {
          const Icon = option.icon;
          return <button key={option.key} className={`report-option${type === option.key ? " report-option-active" : ""}`} onClick={() => setType(option.key)}><span className={`report-option-icon report-icon-${option.key}`}><Icon size={19} /></span><span><strong>{option.title}</strong><small>{option.detail}</small></span><span className="report-option-radio"><i /></span></button>;
        })}
      </section>
      <section className="report-summary-grid">
        <article className="report-stat-card"><span className="report-stat-icon"><ClipboardList size={18} /></span><span className="module-summary-caption">REGISTROS NO RELATÓRIO</span><strong>{summary.total.toString().padStart(2, "0")}</strong><small>{current.detail}</small></article>
        <article className="report-stat-card"><span className="report-stat-icon report-stat-blue"><Activity size={18} /></span><span className="module-summary-caption">UNIDADES EM DIFERENÇA</span><strong>{summary.unidades.toLocaleString("pt-BR")}</strong><small>Diferença absoluta encontrada</small></article>
        <article className="report-stat-card"><span className="report-stat-icon report-stat-green"><CheckCircle2 size={18} /></span><span className="module-summary-caption">CONFERÊNCIAS CONCLUÍDAS</span><strong>{summary.valor.toString().padStart(2, "0")}</strong><small>Ocorrências marcadas como resolvidas</small></article>
      </section>
      <section className="panel report-panel">
        <div className="catalog-toolbar report-toolbar"><div><span className="eyebrow">CENTRAL DE RELATÓRIOS</span><h2>{current.title}</h2><p>Dados consolidados das divergências registradas no sistema.</p></div><div className="report-actions"><button className="button button-secondary" onClick={() => window.print()}><Printer size={16} /> Imprimir</button><button className="button button-primary" onClick={exportCsv} disabled={!rows.length}><ArrowDownToLine size={16} /> Exportar CSV</button></div></div>
        <div className="report-metadata"><span><CalendarDays size={14} /> Gerado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date())}</span><span><i /> Dados atualizados automaticamente</span></div>
        {reportQuery.isLoading ? <div className="table-loading"><div /><div /><div /><div /></div> : rows.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>PRODUTO</th><th>DATA</th><th>QTD. SISTEMA</th><th>QTD. FÍSICA</th><th>DIFERENÇA</th><th>STATUS</th><th>DESCRIÇÃO</th></tr></thead><tbody>
          {rows.map(row => <tr key={row.id}><td><div className="product-cell"><span className="product-mini-icon"><ClipboardList size={15} /></span><span><strong>{row.produtoNome}</strong><small>{row.produtoCodigo}</small></span></div></td><td className="nowrap-cell">{formatDate(row.dataOcorrencia)}</td><td className="numeric-cell">{row.quantidadeSistema}</td><td className="numeric-cell">{row.quantidadeFisica}</td><td><span className={`difference-tag${Number(row.diferenca) ? " difference-negative" : " difference-zero"}`}>{Number(row.diferenca) > 0 ? "+" : ""}{row.diferenca} un.</span></td><td><StatusBadge status={row.status} /></td><td><span className="description-cell" title={row.descricao}>{row.descricao}</span></td></tr>)}
        </tbody></table></div> : <div className="empty-state"><FileBarChart size={25} /><strong>Nenhum dado neste relatório</strong><span>Quando houver registros que correspondam a esta visão, eles aparecerão aqui.</span></div>}
        <div className="table-footnote"><span>Relatório demonstrativo · dados fictícios</span><span>Gerado pelo StockControl</span></div>
      </section>
    </div>
  );
}
