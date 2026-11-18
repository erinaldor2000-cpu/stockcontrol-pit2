import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { produtos, type Occurrence } from "../drizzle/schema";
import { createApplicationSession, destroyApplicationSession } from "./applicationAuth";
import { getDb } from "./db";
import * as inventory from "./inventoryDb";
import { publicProcedure, router } from "./_core/trpc";

const statuses = ["Pendente", "Em análise", "Resolvido"] as const;
const statusSchema = z.enum(statuses);
const positiveId = z.number().int().positive();

const authenticatedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.applicationUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  }
  return next({ ctx: { ...ctx, applicationUser: ctx.applicationUser } });
});

const productInput = z.object({
  codigo: z.string().trim().min(2).max(50),
  nome: z.string().trim().min(2).max(180),
  categoria: z.string().trim().min(2).max(100),
  quantidade: z.number().int().min(0).max(2_000_000_000),
  dataCadastro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const occurrenceInput = z.object({
  produtoId: positiveId,
  dataOcorrencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantidadeSistema: z.number().int().min(0).max(2_000_000_000),
  quantidadeFisica: z.number().int().min(0).max(2_000_000_000),
  descricao: z.string().trim().min(5).max(2000),
  status: statusSchema,
});

function rethrowDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Não foi possível salvar os dados.";
  if (/duplicate|unique|ER_DUP_ENTRY/i.test(message)) {
    throw new TRPCError({ code: "CONFLICT", message: "Já existe um registro com esse código." });
  }
  if (/foreign key|ER_ROW_IS_REFERENCED/i.test(message)) {
    throw new TRPCError({ code: "CONFLICT", message: "Este produto possui ocorrências vinculadas e não pode ser excluído." });
  }
  throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível concluir a operação. Confira os dados e tente novamente." });
}

export const inventoryRouter = router({
  session: router({
    me: publicProcedure.query(({ ctx }) => ctx.applicationUser),
    login: publicProcedure
      .input(z.object({ login: z.string().trim().min(1).max(80), senha: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await createApplicationSession(input.login, input.senha, ctx.res);
          if (!result) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha incorretos." });
          return result;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          return rethrowDatabaseError(error);
        }
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await destroyApplicationSession(ctx.req, ctx.res);
      return { success: true };
    }),
  }),

  dashboard: authenticatedProcedure.query(() => inventory.getDashboardSummary()),

  products: router({
    list: authenticatedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => inventory.listProducts(input?.search)),
    create: authenticatedProcedure.input(productInput).mutation(async ({ input }) => {
      try {
        return await inventory.createProduct(input);
      } catch (error) {
        return rethrowDatabaseError(error);
      }
    }),
    update: authenticatedProcedure
      .input(z.object({ id: positiveId, values: productInput }))
      .mutation(async ({ input }) => {
        try {
          const result = await inventory.updateProduct(input.id, input.values);
          if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado." });
          return result;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          return rethrowDatabaseError(error);
        }
      }),
    remove: authenticatedProcedure.input(z.object({ id: positiveId })).mutation(async ({ input }) => {
      try {
        await inventory.deleteProduct(input.id);
        return { success: true };
      } catch (error) {
        return rethrowDatabaseError(error);
      }
    }),
  }),

  occurrences: router({
    list: authenticatedProcedure
      .input(z.object({
        search: z.string().optional(),
        status: statusSchema.optional(),
        produtoId: positiveId.optional(),
        de: z.string().optional(),
        ate: z.string().optional(),
      }).optional())
      .query(({ input }) => inventory.listOccurrences(input ?? {})),
    create: authenticatedProcedure.input(occurrenceInput).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [product] = await db.select({ id: produtos.id }).from(produtos).where(eq(produtos.id, input.produtoId)).limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado." });
      try {
        return await inventory.createOccurrence(input);
      } catch (error) {
        return rethrowDatabaseError(error);
      }
    }),
    updateStatus: authenticatedProcedure
      .input(z.object({ id: positiveId, status: statusSchema }))
      .mutation(async ({ input }) => {
        const result = await inventory.updateOccurrenceStatus(input.id, input.status);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Ocorrência não encontrada." });
        return result;
      }),
    remove: authenticatedProcedure.input(z.object({ id: positiveId })).mutation(async ({ input }) => {
      await inventory.deleteOccurrence(input.id);
      return { success: true };
    }),
  }),

  reports: authenticatedProcedure
    .input(z.object({ tipo: z.enum(["geral", "pendentes", "resolvidas"]) }).optional())
    .query(async ({ input }) => {
      const status: Occurrence["status"] | undefined = input?.tipo === "pendentes" ? "Pendente" : input?.tipo === "resolvidas" ? "Resolvido" : undefined;
      return inventory.listOccurrences(status ? { status } : {});
    }),
});
