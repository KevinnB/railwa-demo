import { Router, Request, Response } from "express";
import { itemService } from "../services/item.service.js";

const router = Router();

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
  const items = await itemService.list();
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
  const item = await itemService.getById(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
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
  const item = await itemService.create(req.body);
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
  const item = await itemService.update(req.params.id, req.body);
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
  await itemService.remove(req.params.id);
  res.status(204).send();
});

export default router;
