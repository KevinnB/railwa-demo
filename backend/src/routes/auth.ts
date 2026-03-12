import { Router, Request, Response } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

const router = Router();

router.post("/auth/sign-up", async (req: Request, res: Response) => {
  try {
    const result = await auth.api.signUpEmail({ body: req.body });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Sign up failed" });
  }
});

router.post("/auth/sign-in", async (req: Request, res: Response) => {
  try {
    const result = await auth.api.signInEmail({ body: req.body });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message ?? "Invalid credentials" });
  }
});

router.post("/auth/sign-out", async (req: Request, res: Response) => {
  try {
    await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(401).json({ error: error.message ?? "Sign out failed" });
  }
});

router.get("/auth/session", async (req: Request, res: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(session);
});

router.get("/auth/sessions", async (req: Request, res: Response) => {
  try {
    const sessions = await auth.api.listSessions({
      headers: fromNodeHeaders(req.headers),
    });
    res.json(sessions);
  } catch (error: any) {
    res.status(401).json({ error: error.message ?? "Not authenticated" });
  }
});

router.post(
  "/auth/sessions/:token/revoke",
  async (req: Request<{ token: string }>, res: Response) => {
    try {
      await auth.api.revokeSession({
        headers: fromNodeHeaders(req.headers),
        body: { token: req.params.token },
      });
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(401)
        .json({ error: error.message ?? "Failed to revoke session" });
    }
  }
);

router.patch("/auth/user", async (req: Request, res: Response) => {
  try {
    const result = await auth.api.updateUser({
      headers: fromNodeHeaders(req.headers),
      body: req.body,
    });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message ?? "Update failed" });
  }
});

router.post("/auth/change-password", async (req: Request, res: Response) => {
  try {
    await auth.api.changePassword({
      headers: fromNodeHeaders(req.headers),
      body: req.body,
    });
    res.json({ success: true });
  } catch (error: any) {
    res
      .status(400)
      .json({ error: error.message ?? "Password change failed" });
  }
});

export default router;
