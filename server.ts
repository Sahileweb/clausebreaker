import { analyzeLegalDocument, extractTextFromImage } from "./src/services/geminiService"; // Adjust the path if needed
import * as mammoth from "mammoth";
console.log(">>> server.ts is being executed at " + new Date().toISOString());
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import cors from "cors";
import mongoose from "mongoose";
import { Report } from "./src/models/Report";
import PDFDocument from "pdfkit";
import { nanoid } from "nanoid";
import crypto from "crypto";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/clausebreaker";
  mongoose.connect(MONGO_URI)
    .then(() => console.log(">>> Connected to MongoDB"))
    .catch(err => console.error(">>> MongoDB Connection Error:", err));

  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // API Route for multi-format document parsing
  app.post("/api/parse-document", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const mimeType = req.file.mimetype;
      let text = "";

      if (mimeType === "application/pdf") {
        const pdfModule = require("pdf-parse");
        const data = await pdfModule(req.file.buffer);
        text = data.text;
      } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value;
      } else if (mimeType.startsWith("image/")) {
        text = await extractTextFromImage(req.file.buffer, mimeType);
      } else {
        return res.status(400).json({ error: `Unsupported file type: ${mimeType}` });
      }

      res.json({ text });
    } catch (error) {
      console.error("Document parsing error:", error);
      res.status(500).json({ error: "Failed to parse document" });
    }
  });

  // API Route for Gemini Analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { text, language } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "No text provided for analysis" });
      }

      // The server safely handles the API key and Gemini call
      const analysis = await analyzeLegalDocument(text, language);
      res.json(analysis);
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to analyze document" });
    }
  });

  // Share Analysis
  app.post("/api/share", async (req, res) => {
    try {
      const { summary, overallRisk, clauses } = req.body;
      
      const shareId = nanoid ? nanoid(10) : crypto.randomBytes(5).toString('hex');
      const password = crypto.randomBytes(3).toString('hex'); // Random 6 char password

      const newReport = new Report({
        shareId,
        password,
        data: { summary, overallRisk, clauses }
      });

      await newReport.save();

      // Return the shareable link (include password for simplicity in this case)
      const shareUrl = `${req.protocol}://${req.get('host')}/api/share/${shareId}/download?pw=${password}`;
      res.json({ link: shareUrl });
    } catch (error) {
      console.error("Share API Error:", error);
      res.status(500).json({ error: "Failed to create shareable link" });
    }
  });

  // Download Shared PDF
  app.get("/api/share/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const { pw } = req.query;

      const report = await Report.findOne({ shareId: id });

      if (!report || report.password !== pw) {
        return res.status(401).send("Invalid link or password");
      }

      const doc = new PDFDocument();
      const filename = `ClauseBreaker_Analysis_${id}.pdf`;

      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      // PDF Content
      doc.fontSize(24).font('Helvetica-Bold').text("CLAUSEBREAKER AI - LEGAL ANALYSIS", { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text("EXECUTIVE SUMMARY");
      doc.fontSize(11).font('Helvetica').text(report.data.summary);
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text(`OVERALL RISK: ${report.data.overallRisk?.toUpperCase()}`);
      doc.moveDown(2);

      doc.fontSize(16).font('Helvetica-Bold').text("CLAUSE BREAKDOWN");
      doc.moveDown();

      // @ts-ignore
      report.data.clauses.forEach((clause, i) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`[${i + 1}] ${clause.risk?.toUpperCase()} RISK`);
        doc.fontSize(10).font('Helvetica-Oblique').text(`Origin: ${clause.text.substring(0, 100)}...`);
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text("Simplified:");
        doc.fontSize(10).font('Helvetica').text(clause.simplified);
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text("Advice:");
        doc.fontSize(10).font('Helvetica').text(clause.suggestion);
        doc.moveDown();
        doc.rect(doc.x, doc.y, 400, 1).fill("#EEEEEE");
        doc.moveDown();
      });

      doc.end();
    } catch (error) {
      console.error("PDF Download Error:", error);
      res.status(500).send("Failed to generate PDF");
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: {
          usePolling: true,
          interval: 1000,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(">>> Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
