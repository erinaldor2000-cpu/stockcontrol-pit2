import { describe, expect, it } from "vitest";
import { toCsv } from "./format";

describe("toCsv", () => {
  it("neutraliza fórmulas precedidas por operadores, espaços ou controles em texto", () => {
    const result = toCsv([{
      descricao: "=HYPERLINK(\"https://example.invalid\",\"abrir\")",
      nota: "  +SUM(A1:A2)",
      observacao: "\t@SUM(A1:A2)",
      entrada: "\r\n-CMD|\" /C calc",
    }]);
    expect(result).toContain("\"'=HYPERLINK(");
    expect(result).toContain("\"'  +SUM(");
    expect(result).toContain("\"'\t@SUM(");
    expect(result).toContain("\"'\r\n-CMD|\"\" /C calc\"");
  });

  it("preserva texto comum, escapa aspas e mantém valores numéricos", () => {
    const result = toCsv([{ produto: "Mouse \"sem fio\"", saldo: 20, diferenca: -3 }]);
    expect(result).toBe('"produto";"saldo";"diferenca"\r\n"Mouse ""sem fio""";"20";"-3"');
  });

  it("retorna conteúdo vazio para uma lista sem linhas", () => {
    expect(toCsv([])).toBe("");
  });
});
