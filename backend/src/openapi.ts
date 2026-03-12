import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  ItemSchema,
  CreateItemSchema,
  UpdateItemSchema,
  PaginationQuerySchema,
  PaginatedItemsSchema,
} from "./schemas/item.js";
import {
  ErrorSchema,
  MessageSchema,
  AuthResponseSchema,
  SessionResponseSchema,
  SessionListItemSchema,
  SignUpSchema,
  SignInSchema,
  ChangePasswordSchema,
  UpdateUserSchema,
} from "./schemas/auth.js";
import { HealthResponseSchema } from "./schemas/health.js";

const registry = new OpenAPIRegistry();

// --- Security scheme ---

const bearerAuth = registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    description: "Use the token from POST /auth/sign-in response",
  }
);

// --- Health ---

registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["health"],
  summary: "Health check",
  responses: {
    200: {
      description: "Healthy",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
    503: { description: "Unhealthy" },
  },
});

// --- Items ---

registry.registerPath({
  method: "get",
  path: "/items",
  tags: ["items"],
  summary: "List items (paginated)",
  security: [{ [bearerAuth.name]: [] }],
  request: { query: PaginationQuerySchema },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: PaginatedItemsSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/items/{id}",
  tags: ["items"],
  summary: "Get an item by ID",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: ItemSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/items",
  tags: ["items"],
  summary: "Create an item",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateItemSchema } },
    },
  },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: ItemSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/items/{id}",
  tags: ["items"],
  summary: "Update an item",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateItemSchema } },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: ItemSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/items/{id}",
  tags: ["items"],
  summary: "Delete an item",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    204: { description: "No content" },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

// --- Auth ---

registry.registerPath({
  method: "post",
  path: "/auth/sign-up",
  tags: ["auth"],
  summary: "Create a new account",
  description: "Returns a bearer token.",
  request: {
    body: {
      content: { "application/json": { schema: SignUpSchema } },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/sign-in",
  tags: ["auth"],
  summary: "Sign in with email and password",
  description: "Copy the token to the Authorize dialog.",
  request: {
    body: {
      content: { "application/json": { schema: SignInSchema } },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    401: {
      description: "Invalid credentials",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/sign-out",
  tags: ["auth"],
  summary: "Sign out",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: MessageSchema } },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/session",
  tags: ["auth"],
  summary: "Get current session and user",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: SessionResponseSchema } },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/sessions",
  tags: ["auth"],
  summary: "List all active sessions",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z.array(SessionListItemSchema),
        },
      },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/sessions/{token}/revoke",
  tags: ["auth"],
  summary: "Revoke a session by token",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ token: z.string() }),
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: MessageSchema } },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/auth/user",
  tags: ["auth"],
  summary: "Update current user",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: UpdateUserSchema } },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: SessionResponseSchema } },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/change-password",
  tags: ["auth"],
  summary: "Change password",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: ChangePasswordSchema } },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: MessageSchema } },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

// --- Generate document ---

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "Railwa Demo API",
    version: "1.0.0",
    description: "Express + Prisma + Redis POC",
  },
  tags: [
    { name: "auth", description: "Authentication" },
    { name: "items", description: "Items CRUD" },
    { name: "health", description: "Health checks" },
  ],
});
