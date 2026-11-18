import { useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowDownUp, ArrowRight, CalendarDays, ClipboardList, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { todayISO, formatDate, friendlyError } from "@/lib/format";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/pages/DashboardPage";

type OccurrenceStatus = "Pendente" | "Em análise" | "Resolvido";
const statuses: OccurrenceStatus[] = ["Pendente", "Em análise", "Resolvido"];
const statusFromQuery = new URLSearchParams(window.location.search).get("status");
const initialStatus = statuses.includes(statusFromQuery as OccurrenceStatus) ? statusFromQuery as OccurrenceStatus : "";

export default function OccurrencesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | OccurrenceStatus>(initialStatus);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [location] = useLocation();
  const detailId = Number(location.match(/^\/ocorrencias\/(\d+)/)?.[1] ?? 0);
  const queryClient = useQueryClient();
  const filters = useMemo(() => ({ search: search || undefined, status: status || undefined, de: de || undefined, ate: ate || undefined }), [search, status, de, ate]);
  const occurrencesQuery = trpc.inventory.occurrences.list.useQuery(filters);
  const productsQuery = trpc.inventory.products.list.useQuery({});
  const rows = occurrencesQuery.data ?? [];
  const selectedOccurrence = detailId ? rows.find(row => row.id === detailId) : undefined;

  const create = trpc.inventory.occurrences.create.useMutation({
    onSuccess: async () => { await queryClient.invalidateQueries(); toast.success("Divergência registrada com sucesso."); setCreateOpen(false); },
    onError: error => toast.error(friendlyError(error, "Não foi possível registrar a divergência.")),
  });
  const updateStatus = trpc.inventory.occurrences.updateStatus.useMutation({
    onSuccess: async () => { await queryClient.invalidateQueries(); toast.success("Status atualizado."); },
    onError: error => toast.error(friendlyError(error, "Não foi possível alterar o status.")),
  });
  const remove = trpc.inventory.occurrences.remove.useMutation({
    onSuccess: async () => { await queryClient.invalidateQueries(); toast.success("Ocorrência removida."); },
    onError: error => toast.error(friendlyError(error, "Não foi possível remover a ocorrência.")),
  });
  const stats = useMemo(() => ({
    pendentes: rows.filter(row => row.status === "Pendente").length,
    emAnalise: rows.filter(row => row.status === "Em análise").length,
    resolvidas: rows.filter(row => row.status === "Resolvido").length,
  }), [rows]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    create.mutate({
      produtoId: Number(data.get("produtoId")),
      dataOcorrencia: String(data.get("dataOcorrencia")),
      quantidadeSistema: Number(data.get("quantidadeSistema")),
      quantidadeFisica: Number(data.get("quantidadeFisica")),
      descricao: String(data.get("descricao")).trim(),
      status: String(data.get("status")) as OccurrenceStatus,
    });
  }

  function askRemove(id: number) {
    if (window.confirm("Remover esta ocorrência? Essa ação não pode ser desfeita.")) remove.mutate({ id });
  }

  function clearFilters() { setSearch(""); setStatus(""); setDe(""); setAte(""); }
  const activeFilters = Boolean(search || status || de || ate);

  return (
    <div className="module-page">
      <section className="occurrence-summary-strip">
        <div className="occurrence-total-block"><span className="occurrence-total-icon"><ClipboardList size={19} /></span><div><strong>{rows.length.toString().padStart(2, "0")}</strong><span>ocorrências nesta consulta</span></div></div>
        <div className="occurrence-status-count"><i className="status-dot status-dot-pending" /><span>Pendentes</span><strong>{stats.pendentes.toString().padStart(2, "0")}</strong></div>
        <div className="occurrence-status-count"><i className="status-dot status-dot-review" /><span>Em análise</span><strong>{stats.emAnalise.toString().padStart(2, "0")}</strong></div>
        <div className="occurrence-status-count"><i className="status-dot status-dot-done" /><span>Resolvidas</span><strong>{stats.resolvidas.toString().padStart(2, "0")}</strong></div>
        <button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={17} /> Nova divergência</button>
      </section>

      <section className="panel occurrence-panel">
        <div className="catalog-toolbar occurrence-toolbar"><div><h2>Registro de ocorrências</h2><p>Pesquise, filtre e atualize o andamento das conferências.</p></div><span className="filter-label"><Filter size={15} /> FILTROS</span></div>
        <div className="occurrence-filters">
          <label className="search-field occurrence-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar produto ou descrição…" aria-label="Buscar por produto ou descrição" />{search && <button onClick={() => setSearch("")} aria-label="Limpar busca"><X size={15} /></button>}</label>
          <label className="filter-control"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value as "" | OccurrenceStatus)}><option value="">Todos os status</option>{statuses.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="filter-control filter-date"><span>De</span><input type="date" value={de} onChange={event => setDe(event.target.value)} aria-label="Data inicial" /></label>
          <label className="filter-control filter-date"><span>Até</span><input type="date" value={ate} onChange={event => setAte(event.target.value)} aria-label="Data final" /></label>
          {activeFilters && <button className="clear-filters" onClick={clearFilters}><X size={14} /> Limpar</button>}
        </div>
        {occurrencesQuery.isLoading ? <div className="table-loading"><div /><div /><div /><div /></div> : rows.length ? <div className="table-wrap"><table className="data-table occurrence-table"><thead><tr><th>PRODUTO</th><th>DATA</th><th>QTD. SISTEMA</th><th>QTD. FÍSICA</th><th>DIFERENÇA</th><th>DESCRIÇÃO</th><th>STATUS</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
          {rows.map(row => <tr key={row.id}>
            <td><a className="product-link-cell" href={`/ocorrencias/${row.id}`}><span className="product-mini-icon"><ClipboardList size={15} /></span><span><strong>{row.produtoNome}</strong><small>{row.produtoCodigo}</small></span></a></td>
            <td className="nowrap-cell">{formatDate(row.dataOcorrencia)}</td>
            <td className="numeric-cell">{row.quantidadeSistema}</td>
            <td className="numeric-cell">{row.quantidadeFisica}</td>
            <td><span className={`difference-tag${Number(row.diferenca) ? " difference-negative" : " difference-zero"}`}>{Number(row.diferenca) > 0 ? "+" : ""}{row.diferenca} un.</span></td>
            <td><span className="description-cell" title={row.descricao}>{row.descricao}</span></td>
            <td><select className={`status-select ${row.status === "Resolvido" ? "status-select-done" : row.status === "Em análise" ? "status-select-review" : "status-select-pending"}`} value={row.status} onChange={event => updateStatus.mutate({ id: row.id, status: event.target.value as OccurrenceStatus })} aria-label={`Alterar status de ${row.produtoNome}`}>{statuses.map(item => <option key={item} value={item}>{item}</option>)}</select></td>
            <td><div className="row-actions"><a href={`/ocorrencias/${row.id}`} className="icon-button action-edit" aria-label="Ver detalhes"><ArrowRight size={16} /></a><button className="icon-button action-delete" onClick={() => askRemove(row.id)} aria-label="Remover ocorrência"><Trash2 size={15} /></button></div></td>
          </tr>)}
        </tbody></table></div> : <div className="empty-state"><ClipboardList size={25} /><strong>{activeFilters ? "Nenhuma divergência corresponde aos filtros" : "Nenhuma ocorrência registrada"}</strong><span>{activeFilters ? "Ajuste ou limpe os critérios para ver outros resultados." : "Registre a primeira divergência para iniciar o acompanhamento."}</span>{activeFilters ? <button className="button button-secondary" onClick={clearFilters}>Limpar filtros</button> : <button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={15} /> Registrar ocorrência</button>}</div>}
        <div className="table-footnote"><span><ArrowDownUp size={14} /> Quantidade física comparada ao saldo do sistema</span><span>Os resultados são atualizados em tempo real</span></div>
      </section>

      {createOpen && <Modal title="Registrar divergência" onClose={() => setCreateOpen(false)} wide>
        <form className="entity-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-field form-field-full"><label htmlFor="ocorrencia-produto">Produto <b>*</b></label><select id="ocorrencia-produto" name="produtoId" required defaultValue=""><option value="" disabled>Selecione um produto</option>{(productsQuery.data ?? []).map(product => <option key={product.id} value={product.id}>{product.nome} · {product.codigo}</option>)}</select></div>
            <div className="form-field"><label htmlFor="ocorrencia-data">Data da ocorrência <b>*</b></label><input id="ocorrencia-data" type="date" name="dataOcorrencia" defaultValue={todayISO()} required /></div>
            <div className="form-field"><label htmlFor="ocorrencia-status">Status inicial <b>*</b></label><select id="ocorrencia-status" name="status" defaultValue="Pendente">{statuses.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="form-field"><label htmlFor="qtd-sistema">Quantidade registrada no sistema <b>*</b></label><input id="qtd-sistema" type="number" name="quantidadeSistema" min="0" step="1" placeholder="0" required /></div>
            <div className="form-field"><label htmlFor="qtd-fisica">Quantidade encontrada fisicamente <b>*</b></label><input id="qtd-fisica" type="number" name="quantidadeFisica" min="0" step="1" placeholder="0" required /></div>
            <div className="form-field form-field-full"><label htmlFor="ocorrencia-descricao">Descrição da divergência <b>*</b></label><textarea id="ocorrencia-descricao" name="descricao" rows={3} placeholder="Descreva o que foi identificado durante a conferência…" required minLength={5} maxLength={2000} /></div>
          </div>
          {!productsQuery.data?.length && <p className="form-hint form-hint-warning">Cadastre ao menos um produto antes de registrar uma divergência.</p>}
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={create.isPending || !productsQuery.data?.length}>{create.isPending ? "Registrando…" : "Registrar ocorrência"}</button></div>
        </form>
      </Modal>}

      {detailId > 0 && selectedOccurrence && <Modal title="Detalhes da ocorrência" onClose={() => window.history.back()} wide>
        <div className="detail-summary"><div className="detail-main"><span className="eyebrow">OCORRÊNCIA #{String(selectedOccurrence.id).padStart(4, "0")}</span><h3>{selectedOccurrence.produtoNome}</h3><span className="code-pill">{selectedOccurrence.produtoCodigo}</span></div><StatusBadge status={selectedOccurrence.status} /></div>
        <div className="detail-quantity-grid"><div><span>Registrado no sistema</span><strong>{selectedOccurrence.quantidadeSistema}<small> un.</small></strong></div><div><span>Encontrado fisicamente</span><strong>{selectedOccurrence.quantidadeFisica}<small> un.</small></strong></div><div><span>Variação identificada</span><strong className={Number(selectedOccurrence.diferenca) ? "text-negative" : "text-positive"}>{Number(selectedOccurrence.diferenca) > 0 ? "+" : ""}{selectedOccurrence.diferenca}<small> un.</small></strong></div></div>
        <div className="detail-description"><span className="eyebrow">DESCRIÇÃO DA DIVERGÊNCIA</span><p>{selectedOccurrence.descricao}</p><span className="detail-date"><CalendarDays size={14} /> Registrada em {formatDate(selectedOccurrence.dataOcorrencia)}</span></div>
        <div className="detail-status-row"><label htmlFor="detail-status">Atualizar status</label><select id="detail-status" className={`status-select ${selectedOccurrence.status === "Resolvido" ? "status-select-done" : selectedOccurrence.status === "Em análise" ? "status-select-review" : "status-select-pending"}`} value={selectedOccurrence.status} onChange={event => updateStatus.mutate({ id: selectedOccurrence.id, status: event.target.value as OccurrenceStatus })}>{statuses.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="modal-actions"><button className="button button-secondary" onClick={() => window.history.back()}>Fechar</button></div>
      </Modal>}
      {detailId > 0 && !occurrencesQuery.isLoading && !selectedOccurrence && <Modal title="Ocorrência não encontrada" onClose={() => window.history.back()}><p className="detail-description">Este registro não existe ou não está disponível.</p><div className="modal-actions"><a className="button button-primary" href="/ocorrencias">Voltar às ocorrências</a></div></Modal>}
    </div>
  );
}
