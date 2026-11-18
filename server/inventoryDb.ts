import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { ocorrencias, produtos, type Product, type Occurrence } from "../drizzle/schema";
import { getDb } from "./db";

export type OccurrenceFilters = {
  search?: string;
  status?: "Pendente" | "Em análise" | "Resolvido";
  produtoId?: number;
  de?: string;
  ate?: string;
};

const demoProducts = [
  { codigo: "INF-001", nome: "Notebook Dell Inspiron", categoria: "Informática", quantidade: 20 },
  { codigo: "PER-002", nome: "Mouse Logitech M170", categoria: "Periféricos", quantidade: 50 },
  { codigo: "PER-003", nome: "Teclado Mecânico Redragon", categoria: "Periféricos", quantidade: 24 },
  { codigo: "MON-004", nome: "Monitor LG 24 Polegadas", categoria: "Monitores", quantidade: 15 },
  { codigo: "IMP-005", nome: "Impressora HP Laser", categoria: "Impressão", quantidade: 12 },
  { codigo: "PER-006", nome: "Webcam Logitech C920", categoria: "Periféricos", quantidade: 18 },
  { codigo: "ARM-007", nome: "SSD Kingston 480GB", categoria: "Armazenamento", quantidade: 32 },
];

const demoOccurrences = [
  { codigo: "INF-001", referencia: "demo-occ-01", quantidadeSistema: 20, quantidadeFisica: 18, status: "Pendente" as const, descricao: "Diferença encontrada durante inventário mensal." },
  { codigo: "PER-002", referencia: "demo-occ-02", quantidadeSistema: 50, quantidadeFisica: 47, status: "Em análise" as const, descricao: "Possível erro de lançamento." },
  { codigo: "MON-004", referencia: "demo-occ-03", quantidadeSistema: 15, quantidadeFisica: 15, status: "Resolvido" as const, descricao: "Divergência corrigida após conferência." },
  { codigo: "IMP-005", referencia: "demo-occ-04", quantidadeSistema: 12, quantidadeFisica: 10, status: "Pendente" as const, descricao: "Equipamentos não localizados durante conferência." },
];

/** Semeia linha a linha e nunca apaga nem redefine os registros demonstrativos existentes. */
export async function ensureDemoData() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL é obrigatório para iniciar o controle de estoque.");

  const today = new Date().toISOString().slice(0, 10);
  for (const product of demoProducts) {
    const [existing] = await db.select({ id: produtos.id }).from(produtos).where(eq(produtos.codigo, product.codigo)).limit(1);
    if (!existing) {
      await db.insert(produtos).values({ ...product, dataCadastro: today });
    }
  }

  const existingProducts = await db.select({ id: produtos.id, codigo: produtos.codigo }).from(produtos);
  const productIds = new Map(existingProducts.map(product => [product.codigo, product.id]));
  for (const item of demoOccurrences) {
    const [existing] = await db.select({ id: ocorrencias.id }).from(ocorrencias).where(eq(ocorrencias.referencia, item.referencia)).limit(1);
    const produtoId = productIds.get(item.codigo);
    if (!existing && produtoId) {
      await db.insert(ocorrencias).values({
        produtoId,
        referencia: item.referencia,
        dataOcorrencia: today,
        quantidadeSistema: item.quantidadeSistema,
        quantidadeFisica: item.quantidadeFisica,
        descricao: item.descricao,
        status: item.status,
      });
    }
  }
}

export async function listProducts(search = ""): Promise<Product[]> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const normalized = search.trim();
  return db
    .select()
    .from(produtos)
    .where(normalized ? or(like(produtos.nome, `%${normalized}%`), like(produtos.codigo, `%${normalized}%`), like(produtos.categoria, `%${normalized}%`)) : undefined)
    .orderBy(produtos.nome);
}

export async function createProduct(values: Omit<Product, "id" | "criadoEm">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.insert(produtos).values(values);
  const [created] = await db.select().from(produtos).where(eq(produtos.codigo, values.codigo)).limit(1);
  return created;
}

export async function updateProduct(id: number, values: Omit<Product, "id" | "criadoEm">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(produtos).set(values).where(eq(produtos.id, id));
  const [updated] = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return updated;
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.delete(produtos).where(eq(produtos.id, id));
}

export async function listOccurrences(filters: OccurrenceFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const conditions = [];
  if (filters.status) conditions.push(eq(ocorrencias.status, filters.status));
  if (filters.produtoId) conditions.push(eq(ocorrencias.produtoId, filters.produtoId));
  if (filters.de) conditions.push(gte(ocorrencias.dataOcorrencia, filters.de));
  if (filters.ate) conditions.push(lte(ocorrencias.dataOcorrencia, filters.ate));
  const search = filters.search?.trim();
  if (search) {
    conditions.push(or(
      like(produtos.nome, `%${search}%`),
      like(produtos.codigo, `%${search}%`),
      like(ocorrencias.descricao, `%${search}%`),
    )!);
  }

  return db
    .select({
      id: ocorrencias.id,
      produtoId: ocorrencias.produtoId,
      produtoNome: produtos.nome,
      produtoCodigo: produtos.codigo,
      dataOcorrencia: ocorrencias.dataOcorrencia,
      quantidadeSistema: ocorrencias.quantidadeSistema,
      quantidadeFisica: ocorrencias.quantidadeFisica,
      diferenca: sql<number>`${ocorrencias.quantidadeFisica} - ${ocorrencias.quantidadeSistema}`,
      descricao: ocorrencias.descricao,
      status: ocorrencias.status,
    })
    .from(ocorrencias)
    .innerJoin(produtos, eq(ocorrencias.produtoId, produtos.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ocorrencias.dataOcorrencia), desc(ocorrencias.id));
}

export async function createOccurrence(values: Omit<Occurrence, "id" | "referencia" | "criadoEm">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.insert(ocorrencias).values(values);
  const [created] = await db.select().from(ocorrencias).orderBy(desc(ocorrencias.id)).limit(1);
  return created;
}

export async function updateOccurrenceStatus(id: number, status: Occurrence["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(ocorrencias).set({ status }).where(eq(ocorrencias.id, id));
  const [updated] = await db.select().from(ocorrencias).where(eq(ocorrencias.id, id)).limit(1);
  return updated;
}

export async function deleteOccurrence(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.delete(ocorrencias).where(eq(ocorrencias.id, id));
}

export async function getDashboardSummary() {
  const [occurrences, productsCount] = await Promise.all([
    listOccurrences(),
    (async () => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indisponível.");
      const [row] = await db.select({ total: sql<number>`count(*)` }).from(produtos);
      return Number(row?.total ?? 0);
    })(),
  ]);
  const count = (status: Occurrence["status"]) => occurrences.filter(row => row.status === status).length;
  return {
    total: occurrences.length,
    pendentes: count("Pendente"),
    emAnalise: count("Em análise"),
    resolvidas: count("Resolvido"),
    produtos: productsCount,
    diferencasUnidades: occurrences.reduce((sum, row) => sum + Math.abs(Number(row.diferenca)), 0),
    recentes: occurrences.slice(0, 5),
  };
}
