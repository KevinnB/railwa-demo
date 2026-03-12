import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { cache } from "../lib/redis.js";

const router = Router();

const CACHE_KEY_LIST = "items:list";
const cacheKeyById = (id: string) => `items:${id}`;

/**
 * @swagger
 * /items:
 *   get:
 *     tags: [items]
 *     summary: List all items
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */
router.get("/items", async (_req: Request, res: Response) => {
  const cached = await cache.get(CACHE_KEY_LIST);
  if (cached) {
    res.json(cached);
    return;
  }

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
  });

  await cache.set(CACHE_KEY_LIST, items);
  res.json(items);
});

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     tags: [items]
 *     summary: Get an item by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/items/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const cached = await cache.get(cacheKeyById(id));
  if (cached) {
    res.json(cached);
    return;
  }

  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  await cache.set(cacheKeyById(id), item);
  res.json(item);
});

/**
 * @swagger
 * /items:
 *   post:
 *     tags: [items]
 *     summary: Create an item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 */
router.post("/items", async (req: Request, res: Response) => {
  const item = await prisma.item.create({
    data: req.body,
  });

  await cache.del(CACHE_KEY_LIST);
  res.status(201).json(item);
});

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     tags: [items]
 *     summary: Update an item
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 */
router.put("/items/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const item = await prisma.item.update({
    where: { id },
    data: req.body,
  });

  await cache.del(CACHE_KEY_LIST, cacheKeyById(id));
  res.json(item);
});

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     tags: [items]
 *     summary: Delete an item
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: No content
 */
router.delete("/items/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  await prisma.item.delete({ where: { id } });
  await cache.del(CACHE_KEY_LIST, cacheKeyById(id));
  res.status(204).send();
});

export default router;
