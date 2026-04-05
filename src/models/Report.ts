import mongoose from "mongoose";

const ClauseSchema = new mongoose.Schema({
  text: String,
  simplified: String,
  risk: String,
  explanation: String,
  suggestion: String,
});

const ReportSchema = new mongoose.Schema({
  shareId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  data: {
    summary: String,
    overallRisk: String,
    clauses: [ClauseSchema],
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export const Report = mongoose.model("Report", ReportSchema);
