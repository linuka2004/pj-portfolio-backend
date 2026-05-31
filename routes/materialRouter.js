import express from "express";
import {
  createMaterial,
  getAllMaterials,
  getDailyStockRecords,
  upsertDailyStockRecord,
} from "../controllers/materialController.js";

const materialRouter = express.Router();

// Materials list for the main cards/boxes
materialRouter.get("/", getAllMaterials);

// Create a new material (stock type)
materialRouter.post("/", createMaterial);

// Add or update a daily stock record for a material
materialRouter.post("/:materialId/stock-records", upsertDailyStockRecord);

// Fetch historical daily stock records (optional date range filter)
materialRouter.get("/:materialId/stock-records", getDailyStockRecords);

export default materialRouter;
