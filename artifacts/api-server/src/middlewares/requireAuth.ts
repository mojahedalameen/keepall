import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  userId: string;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthedRequest).userId = userId;

  // Upsert user record
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(usersTable).values({ clerkId: userId }).onConflictDoNothing();
  } else if (!existing[0].isActive) {
    res.status(403).json({ error: "Account is deactivated" });
    return;
  }

  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers["x-admin-key"];
  if (!adminSecret || provided !== adminSecret) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  (req as AuthedRequest).userId = userId;
  next();
};
