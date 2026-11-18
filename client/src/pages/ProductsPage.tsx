import { useMemo, useState, type FormEvent } from "react";
import { Boxes, CalendarDays, Edit3, Package, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { todayISO, formatDate, friendlyError } from "@/lib/format";
import { Modal } from "@/components/Modal";
import type { Product } from "../../../drizzle/schema";
import { useQueryClient } from "@tanstack/react-query";

const emptyForm = { codigo: "", nome: "", categoria: "", quantidade: 0, dataCadastro: todayISO() };

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<Product | null | false>(false);
  const queryClient = useQueryClient();
  const productsQuery = trpc.inventory.products.list.useQuery({ search });
  const products = productsQuery.data ?? [];
  const create = trpc.inventory.products.create.useMutation({
    onSuccess: async () => { await queryClient.invalidateQueries(); toast.success("Produto cadastrado com sucesso."); setEditor(false); },
    onError: error => toast.error(friendlyError(error, "Não foi possível cadastrar o produto.")),
  });
  const update = trpc.inventory.products.update.useMutation({
    onSuccess: async () => { await queryClient.invalidateQueries(); toast.success("Produto atualizado."); setEditor(false); },
    onError: error => toast.error(friendlyError(error, "Não foi possível atualizar o produto.")),
  });
  const remove = trpc.inventory.products.remove.useMutation({
    onSuccess: async () => { await queryClient.invalidateQueries(); toast.success("Produto removido do catálogo."); },
    onError: error => toast.error(friendlyError(error, "Não foi possível remover o produto.")),
  });
  const totalUnits = useMemo(() => products.reduce((sum, product) => sum + product.quantidade, 0), [products]);
  const categories = new Set(products.map(product => product.categoria)).size;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = {
      codigo: String(data.get("codigo")).trim(),
      nome: String(data.get("nome")).trim(),
      categoria: String(data.get("categoria")).trim(),
      quantidade: Number(data.get("quantidade")),
      dataCadastro: String(data.get("dataCadastro")),
    };
    if (editor) update.mutate({ id: editor.id, values });
    else create.mutate(values);
  }

  function askRemove(product: Product) {
    if (window.confirm(`Remover “${product.nome}” do catálogo? Produtos vinculados a ocorrências não podem ser removidos.`)) remove.mutate({ id: product.id });
  }

  return (
    <div className="module-page">
      <section className="module-summary-row">
        <div className="module-summary-card"><span className="module-summary-icon"><Boxes size={18} /></span><span className="module-summary-caption">ITENS NO CATÁLOGO</span><strong>{products.length.toString().padStart(2, "0")}</strong><small>Produtos cadastrados</small></div>
        <div className="module-summary-card"><span className="module-summary-icon module-summary-icon-blue"><Package size={18} /></span><span className="module-summary-caption">UNIDADES EM ESTOQUE</span><strong>{totalUnits.toLocaleString("pt-BR")}</strong><small>Quantidade registrada</small></div>
        <div className="module-summary-card"><span className="module-summary-icon module-summary-icon-violet"><Boxes size={18} /></span><span className="module-summary-caption">CATEGORIAS</span><strong>{categories.toString().padStart(2, "0")}</strong><small>Grupos de produtos</small></div>
      </section>
      <section className="panel catalog-panel">
        <div className="catalog-toolbar"><div><h2>Catálogo de produtos</h2><p>Cadastre e atualize os itens que fazem parte do inventário.</p></div><button className="button button-primary" onClick={() => setEditor(null)}><Plus size={17} /> Novo produto</button></div>
        <div className="table-tools"><label className="search-field"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome, código ou categoria…" aria-label="Buscar produtos" />{search && <button onClick={() => setSearch("")} aria-label="Limpar busca"><X size={15} /></button>}</label><span className="result-count">{productsQuery.isLoading ? "Carregando…" : `${products.length} ${products.length === 1 ? "produto" : "produtos"}`}</span></div>
        {productsQuery.isLoading ? <div className="table-loading"><div /><div /><div /><div /></div> : products.length ? <div className="table-wrap"><table className="data-table product-table"><thead><tr><th>PRODUTO</th><th>CÓDIGO</th><th>CATEGORIA</th><th>ESTOQUE ATUAL</th><th>CADASTRADO EM</th><th className="actions-heading">AÇÕES</th></tr></thead><tbody>
          {products.map(product => <tr key={product.id}>
            <td><div className="product-cell"><span className="product-mini-icon"><Package size={16} /></span><strong>{product.nome}</strong></div></td>
            <td><span className="code-pill">{product.codigo}</span></td>
            <td><span className="category-text">{product.categoria}</span></td>
            <td><span className="stock-count"><strong>{product.quantidade.toLocaleString("pt-BR")}</strong><small> un.</small></span></td>
            <td><span className="date-cell"><CalendarDays size={14} /> {formatDate(product.dataCadastro)}</span></td>
            <td><div className="row-actions"><button className="icon-button action-edit" onClick={() => setEditor(product)} title={`Editar ${product.nome}`} aria-label={`Editar ${product.nome}`}><Edit3 size={16} /></button><button className="icon-button action-delete" onClick={() => askRemove(product)} title={`Remover ${product.nome}`} aria-label={`Remover ${product.nome}`} disabled={remove.isPending}><Trash2 size={16} /></button></div></td>
          </tr>)}
        </tbody></table></div> : <div className="empty-state"><Package size={25} /><strong>{search ? "Nenhum produto encontrado" : "Seu catálogo está vazio"}</strong><span>{search ? "Tente outro termo ou remova o filtro." : "Cadastre produtos para relacioná-los às divergências."}</span>{!search && <button className="button button-primary" onClick={() => setEditor(null)}><Plus size={15} /> Cadastrar produto</button>}</div>}
        <div className="table-footnote"><span><i /> Produtos relacionados a ocorrências não podem ser removidos.</span><span>Estoque registrado no catálogo</span></div>
      </section>

      {editor !== false && <Modal title={editor ? "Editar produto" : "Cadastrar produto"} onClose={() => setEditor(false)}>
        <form className="entity-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-field"><label htmlFor="produto-codigo">Código do produto <b>*</b></label><input id="produto-codigo" name="codigo" placeholder="Ex.: INF-008" defaultValue={editor?.codigo ?? ""} required maxLength={50} /></div>
            <div className="form-field"><label htmlFor="produto-nome">Nome do produto <b>*</b></label><input id="produto-nome" name="nome" placeholder="Digite o nome" defaultValue={editor?.nome ?? ""} required maxLength={180} /></div>
            <div className="form-field"><label htmlFor="produto-categoria">Categoria <b>*</b></label><input id="produto-categoria" name="categoria" placeholder="Ex.: Periféricos" defaultValue={editor?.categoria ?? ""} required maxLength={100} /></div>
            <div className="form-field"><label htmlFor="produto-quantidade">Quantidade em estoque <b>*</b></label><input id="produto-quantidade" name="quantidade" type="number" min="0" step="1" defaultValue={editor?.quantidade ?? 0} required /></div>
            <div className="form-field form-field-full"><label htmlFor="produto-data">Data de cadastro <b>*</b></label><input id="produto-data" name="dataCadastro" type="date" defaultValue={editor?.dataCadastro ?? todayISO()} required /></div>
          </div>
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setEditor(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Salvando…" : editor ? "Salvar alterações" : "Cadastrar produto"}</button></div>
        </form>
      </Modal>}
    </div>
  );
}
