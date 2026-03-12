import { Router, Request, Response } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

const router = Router();

// --- Sign Up / Sign In / Sign Out ---

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     tags: [auth]
 *     summary: Create a new account
 *     description: Returns a bearer token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/auth/sign-up", async (req: Request, res: Response) => {
  try {
    const result = await auth.api.signUpEmail({ body: req.body });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Sign up failed" });
  }
});

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     tags: [auth]
 *     summary: Sign in with email and password
 *     description: Copy the token to the Authorize dialog.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/auth/sign-in", async (req: Request, res: Response) => {
  try {
    const result = await auth.api.signInEmail({ body: req.body });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message ?? "Invalid credentials" });
  }
});

/**
 * @swagger
 * /auth/sign-out:
 *   post:
 *     tags: [auth]
 *     summary: Sign out
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// --- Session ---

/**
 * @swagger
 * /auth/session:
 *   get:
 *     tags: [auth]
 *     summary: Get current session and user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     tags: [auth]
 *     summary: List all active sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   token:
 *                     type: string
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /auth/sessions/{token}/revoke:
 *   post:
 *     tags: [auth]
 *     summary: Revoke a session by token
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// --- User Management ---

/**
 * @swagger
 * /auth/user:
 *   patch:
 *     tags: [auth]
 *     summary: Update current user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *               image:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [auth]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               revokeOtherSessions:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
