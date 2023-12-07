import { endpoint } from "controllers/controller";
import express from "express";

const router = express.Router({ mergeParams: true });

router.post("/endpoint", endpoint);

export default router;
