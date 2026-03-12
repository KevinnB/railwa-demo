import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { itemService } from "../services/item.service.js";

const router = Router();

// All routes in this router require authentication
router.use(authenticate);

/**
 * @swagger
 * /protected/items:
 *   get:
 *     tags: [protected-items]
 *     summary: List all items (auth required)
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
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/items", async (_req: Request, res: Response) => {
  const items = await itemService.list();
  res.json(items);
});

/**
 * @swagger
 * /protected/items/{id}:
 *   get:
 *     tags: [protected-items]
 *     summary: Get an item by ID (auth required)
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /protected/items:
 *   post:
 *     tags: [protected-items]
 *     summary: Create an item (auth required)
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/items", async (req: Request, res: Response) => {
  const item = await itemService.create(req.body, req.session.user.id);
  res.status(201).json(item);
});

/**
 * @swagger
 * /protected/items/{id}:
 *   put:
 *     tags: [protected-items]
 *     summary: Update an item (auth required)
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/items/:id", async (req: Request<{ id: string }>, res: Response) => {
  const item = await itemService.update(req.params.id, req.body);
  res.json(item);
});

/**
 * @swagger
 * /protected/items/{id}:
 *   delete:
 *     tags: [protected-items]
 *     summary: Delete an item (auth required)
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/items/:id", async (req: Request<{ id: string }>, res: Response) => {
  await itemService.remove(req.params.id);
  res.status(204).send();
});

export default router;
