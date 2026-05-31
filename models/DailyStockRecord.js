import mongoose from "mongoose";

const dailyStockRecordSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    date: {
      // normalized to start-of-day (00:00:00.000) to represent a "daily" record
      type: Date,
      required: true,
      index: true,
    },
    quantityKg: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Only one record per material per day (supports "add or update" semantics)
dailyStockRecordSchema.index({ material: 1, date: 1 }, { unique: true });

const DailyStockRecord = mongoose.model("DailyStockRecord", dailyStockRecordSchema);

export default DailyStockRecord;
