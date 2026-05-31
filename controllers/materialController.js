import Material from "../models/Material.js";
import DailyStockRecord from "../models/DailyStockRecord.js";
import { isAdmin } from "./userController.js";

function normalizeToStartOfDay(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getAllMaterials(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  try {
    const materials = await Material.find().sort({ name: 1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: "Error fetching materials", error: error.message });
  }
}

export async function upsertDailyStockRecord(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const { materialId } = req.params;
  const { date, quantityKg } = req.body;

  const normalizedDate = normalizeToStartOfDay(date);
  if (!normalizedDate) {
    res.status(400).json({ message: "Invalid date" });
    return;
  }

  const quantity = Number(quantityKg);
  if (!Number.isFinite(quantity) || quantity < 0) {
    res.status(400).json({ message: "Invalid quantityKg" });
    return;
  }

  try {
    const material = await Material.findById(materialId);
    if (!material) {
      res.status(404).json({ message: "Material not found" });
      return;
    }

    const record = await DailyStockRecord.findOneAndUpdate(
      { material: material._id, date: normalizedDate },
      { $set: { quantityKg: quantity } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(record);
  } catch (error) {
    // Duplicate key edge-case (race) — surface a clean message
    if (error?.code === 11000) {
      res.status(409).json({ message: "Daily stock record already exists for that date" });
      return;
    }

    res.status(500).json({ message: "Error saving daily stock record", error: error.message });
  }
}

export async function getDailyStockRecords(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const { materialId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const material = await Material.findById(materialId);
    if (!material) {
      res.status(404).json({ message: "Material not found" });
      return;
    }

    const filter = { material: material._id };

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const start = normalizeToStartOfDay(startDate);
        if (!start) {
          res.status(400).json({ message: "Invalid startDate" });
          return;
        }
        filter.date.$gte = start;
      }

      if (endDate) {
        const end = normalizeToStartOfDay(endDate);
        if (!end) {
          res.status(400).json({ message: "Invalid endDate" });
          return;
        }
        filter.date.$lte = end;
      }

      // If both were missing/invalid, remove date filter
      if (Object.keys(filter.date).length === 0) {
        delete filter.date;
      }
    }

    const records = await DailyStockRecord.find(filter).sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Error fetching daily stock records", error: error.message });
  }
}

export async function createMaterial(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";

  if (!name) {
    res.status(400).json({ message: "Material name is required" });
    return;
  }

  try {
    const material = await Material.create({ name, description });
    res.status(201).json(material);
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409).json({ message: "Material already exists" });
      return;
    }

    res.status(500).json({ message: "Error creating material", error: error.message });
  }
}

export async function deleteMaterial(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const { materialId } = req.params;

  try {
    const material = await Material.findById(materialId);
    if (!material) {
      res.status(404).json({ message: "Material not found" });
      return;
    }

    // Delete all stock records associated with this material
    await DailyStockRecord.deleteMany({ material: material._id });

    // Delete the material
    await Material.findByIdAndDelete(materialId);

    res.status(200).json({ message: "Material and its records deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting material", error: error.message });
  }
}

export async function deleteDailyStockRecord(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const { materialId, recordId } = req.params;

  try {
    const material = await Material.findById(materialId);
    if (!material) {
      res.status(404).json({ message: "Material not found" });
      return;
    }

    const record = await DailyStockRecord.findOneAndDelete({
      _id: recordId,
      material: material._id,
    });

    if (!record) {
      res.status(404).json({ message: "Stock record not found" });
      return;
    }

    res.status(200).json({ message: "Stock record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting stock record", error: error.message });
  }
}
