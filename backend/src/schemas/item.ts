import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const ItemSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    userId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Item");

export const CreateItemSchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
  })
  .openapi("CreateItem");

export const UpdateItemSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).nullable().optional(),
  })
  .openapi("UpdateItem");

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(25).default(10),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export const PaginatedItemsSchema = z
  .object({
    data: z.array(ItemSchema),
    meta: PaginationMetaSchema,
  })
  .openapi("PaginatedItems");
