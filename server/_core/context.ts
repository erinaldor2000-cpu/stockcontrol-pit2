import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { ApplicationUser, User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getApplicationUser } from "../applicationAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  applicationUser: ApplicationUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let applicationUser: ApplicationUser | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }
  try {
    applicationUser = await getApplicationUser(opts.req);
  } catch (error) {
    // A missing or expired inventory session leaves the visitor unauthenticated.
    applicationUser = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    applicationUser,
  };
}
