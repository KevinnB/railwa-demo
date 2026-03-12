import { FastifyInstance } from "fastify";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

// --- Schemas ---

const signUpBodySchema = {
  type: "object",
  required: ["name", "email", "password"],
  properties: {
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8 },
  },
  additionalProperties: false,
} as const;

const signInBodySchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string" },
  },
  additionalProperties: false,
} as const;

const changePasswordBodySchema = {
  type: "object",
  required: ["currentPassword", "newPassword"],
  properties: {
    currentPassword: { type: "string" },
    newPassword: { type: "string", minLength: 8 },
    revokeOtherSessions: { type: "boolean" },
  },
  additionalProperties: false,
} as const;

const updateUserBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    image: { type: "string", nullable: true },
  },
  additionalProperties: false,
} as const;

const authResponseSchema = {
  type: "object",
  properties: {
    token: { type: "string", description: "Bearer token — use in Authorize dialog" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        emailVerified: { type: "boolean" },
      },
    },
  },
} as const;

const sessionResponseSchema = {
  type: "object",
  properties: {
    session: {
      type: "object",
      properties: {
        id: { type: "string" },
        userId: { type: "string" },
        token: { type: "string" },
        expiresAt: { type: "string", format: "date-time" },
        ipAddress: { type: "string", nullable: true },
        userAgent: { type: "string", nullable: true },
      },
    },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        emailVerified: { type: "boolean" },
        image: { type: "string", nullable: true },
      },
    },
  },
} as const;

const sessionListSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      userId: { type: "string" },
      token: { type: "string" },
      expiresAt: { type: "string", format: "date-time" },
      ipAddress: { type: "string", nullable: true },
      userAgent: { type: "string", nullable: true },
    },
  },
} as const;

const messageSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
  },
} as const;

const errorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
} as const;

// --- Interfaces ---

interface SignUpBody {
  name: string;
  email: string;
  password: string;
}

interface SignInBody {
  email: string;
  password: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

interface UpdateUserBody {
  name?: string;
  image?: string | null;
}

interface RevokeSessionParams {
  token: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // --- Sign Up / Sign In / Sign Out ---

  fastify.post<{ Body: SignUpBody }>(
    "/auth/sign-up",
    {
      schema: {
        tags: ["auth"],
        description: "Create a new account. Returns a bearer token.",
        body: signUpBodySchema,
        response: { 200: authResponseSchema, 400: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        const result = await auth.api.signUpEmail({ body: request.body });
        return reply.send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message ?? "Sign up failed" });
      }
    }
  );

  fastify.post<{ Body: SignInBody }>(
    "/auth/sign-in",
    {
      schema: {
        tags: ["auth"],
        description: "Sign in with email and password. Copy the token to the Authorize dialog.",
        body: signInBodySchema,
        response: { 200: authResponseSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        const result = await auth.api.signInEmail({ body: request.body });
        return reply.send(result);
      } catch (error: any) {
        return reply.status(401).send({ error: error.message ?? "Invalid credentials" });
      }
    }
  );

  fastify.post(
    "/auth/sign-out",
    {
      schema: {
        tags: ["auth"],
        description: "Sign out and invalidate the current session.",
        security: [{ bearerAuth: [] }],
        response: { 200: messageSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        await auth.api.signOut({
          headers: fromNodeHeaders(request.headers),
        });
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.status(401).send({ error: error.message ?? "Sign out failed" });
      }
    }
  );

  // --- Session ---

  fastify.get(
    "/auth/session",
    {
      schema: {
        tags: ["auth"],
        description: "Get the current session and user.",
        security: [{ bearerAuth: [] }],
        response: { 200: sessionResponseSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({ error: "Not authenticated" });
      }

      return reply.send(session);
    }
  );

  fastify.get(
    "/auth/sessions",
    {
      schema: {
        tags: ["auth"],
        description: "List all active sessions for the current user.",
        security: [{ bearerAuth: [] }],
        response: { 200: sessionListSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        const sessions = await auth.api.listSessions({
          headers: fromNodeHeaders(request.headers),
        });
        return reply.send(sessions);
      } catch (error: any) {
        return reply.status(401).send({ error: error.message ?? "Not authenticated" });
      }
    }
  );

  fastify.post<{ Params: RevokeSessionParams }>(
    "/auth/sessions/:token/revoke",
    {
      schema: {
        tags: ["auth"],
        description: "Revoke a specific session by its token.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["token"],
          properties: { token: { type: "string" } },
        },
        response: { 200: messageSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        await auth.api.revokeSession({
          headers: fromNodeHeaders(request.headers),
          body: { token: request.params.token },
        });
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.status(401).send({ error: error.message ?? "Failed to revoke session" });
      }
    }
  );

  // --- User Management ---

  fastify.patch<{ Body: UpdateUserBody }>(
    "/auth/user",
    {
      schema: {
        tags: ["auth"],
        description: "Update the current user's name or image.",
        security: [{ bearerAuth: [] }],
        body: updateUserBodySchema,
        response: { 200: sessionResponseSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        const result = await auth.api.updateUser({
          headers: fromNodeHeaders(request.headers),
          body: request.body,
        });
        return reply.send(result);
      } catch (error: any) {
        return reply.status(401).send({ error: error.message ?? "Update failed" });
      }
    }
  );

  fastify.post<{ Body: ChangePasswordBody }>(
    "/auth/change-password",
    {
      schema: {
        tags: ["auth"],
        description: "Change the current user's password. Optionally revoke other sessions.",
        security: [{ bearerAuth: [] }],
        body: changePasswordBodySchema,
        response: { 200: messageSchema, 400: errorSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      try {
        await auth.api.changePassword({
          headers: fromNodeHeaders(request.headers),
          body: request.body,
        });
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message ?? "Password change failed" });
      }
    }
  );
}
