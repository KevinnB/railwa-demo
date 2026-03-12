export const itemSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    userId: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const itemListSchema = {
  type: "array",
  items: itemSchema,
} as const;

export const createItemSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    description: { type: "string", maxLength: 1000 },
  },
  additionalProperties: false,
} as const;

export const updateItemSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    description: { type: "string", maxLength: 1000, nullable: true },
  },
  additionalProperties: false,
} as const;

export const itemParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
} as const;

export const errorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
} as const;
