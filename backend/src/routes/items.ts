import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { itemService, MAX_PAGE_SIZE } from "../services/item.service.js";

const router = Router();

router.get("/items", authenticate, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize as string) || 10));
  const result = await itemService.list(page, pageSize);
  res.json(result);
});

router.get("/items/:id", authenticate, async (req: Request<{ id: string }>, res: Response) => {
  const item = await itemService.getById(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

router.post("/items", authenticate, async (req: Request, res: Response) => {
  const item = await itemService.create(req.body, req.session.user.id);
  res.status(201).json(item);
});

router.put("/items/:id", authenticate, async (req: Request<{ id: string }>, res: Response) => {
  const item = await itemService.update(req.params.id, req.body);
  res.json(item);
});

router.delete("/items/:id", authenticate, async (req: Request<{ id: string }>, res: Response) => {
  await itemService.remove(req.params.id);
  res.status(204).send();
});

export default router;
