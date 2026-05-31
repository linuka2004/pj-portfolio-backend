import express from "express";
import {
  createMaterial,
  deleteMaterial,
  deleteDailyStockRecord,
  getAllMaterials,
  getDailyStockRecords,
  upsertDailyStockRecord,
} from "../controllers/materialController.js";

const materialRouter = express.Router();

// Materials list for the main cards/boxes
materialRouter.get("/", getAllMaterials);

// Create a new material (stock type)
materialRouter.post("/", createMaterial);

// Delete a material and its records
materialRouter.delete("/:materialId", deleteMaterial);

// Add or update a daily stock record for a material
materialRouter.post("/:materialId/stock-records", upsertDailyStockRecord);

// Fetch historical daily stock records (optional date range filter)
materialRouter.get("/:materialId/stock-records", getDailyStockRecords);

// Delete a specific stock record
materialRouter.delete("/:materialId/stock-records/:recordId", deleteDailyStockRecord);

export default materialRouter;
