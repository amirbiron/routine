import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sanitizeUser } from "../db";
import { sdk } from "./sdk";

/** User ללא passwordHash — בטוח להחזיק בקונטקסט */
export type SafeUser = Omit<User, "passwordHash">;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: SafeUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: SafeUser | null = null;

  try {
    const fullUser = await sdk.authenticateRequest(opts.req);
    user = sanitizeUser(fullUser);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
