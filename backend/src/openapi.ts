import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Railwa Demo API",
      version: "1.0.0",
      description: "Express + Prisma + Redis POC",
    },
    tags: [
      { name: "auth", description: "Authentication (sign up, sign in)" },
      { name: "items", description: "Items CRUD (public)" },
      { name: "protected-items", description: "Items CRUD (auth required)" },
      { name: "health", description: "Health checks" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Use the token from POST /auth/sign-in response",
        },
      },
      schemas: {
        Item: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            userId: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string", description: "Bearer token" },
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
        },
        SessionResponse: {
          type: "object",
          properties: {
            session: {
              type: "object",
              properties: {
                id: { type: "string" },
                userId: { type: "string" },
                token: { type: "string" },
                expiresAt: { type: "string", format: "date-time" },
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
        },
        Message: {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const openApiDocument = swaggerJsdoc(options);
