import {
  date,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Usuários OAuth legados do template; mantidos para não quebrar serviços-base existentes. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Conta local de demonstração; `senha` contém somente o hash scrypt, nunca texto puro. */
export const usuarios = mysqlTable("usuarios", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 120 }).notNull(),
  login: varchar("login", { length: 80 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const appSessions = mysqlTable("sessoes_aplicacao", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  usuarioId: int("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expira_em").notNull(),
  createdAt: timestamp("criado_em").defaultNow().notNull(),
});

export const produtos = mysqlTable("produtos", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nome: varchar("nome", { length: 180 }).notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  quantidade: int("quantidade").notNull().default(0),
  dataCadastro: date("data_cadastro", { mode: "string" }).notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const ocorrencias = mysqlTable("ocorrencias", {
  id: int("id").autoincrement().primaryKey(),
  produtoId: int("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "restrict" }),
  dataOcorrencia: date("data_ocorrencia", { mode: "string" }).notNull(),
  quantidadeSistema: int("quantidade_sistema").notNull(),
  quantidadeFisica: int("quantidade_fisica").notNull(),
  descricao: text("descricao").notNull(),
  status: mysqlEnum("status", ["Pendente", "Em análise", "Resolvido"])
    .notNull()
    .default("Pendente"),
  /** Chave interna que torna a carga de demonstração idempotente sem sobrescrever alterações. */
  referencia: varchar("referencia", { length: 40 }).unique(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ApplicationUser = Pick<typeof usuarios.$inferSelect, "id" | "nome" | "login">;
export type Product = typeof produtos.$inferSelect;
export type Occurrence = typeof ocorrencias.$inferSelect;
