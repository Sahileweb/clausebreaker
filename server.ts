import dotenv from "dotenv";
dotenv.config(); // THIS FIXES THE MONGODB SHARE CRASH!

import { analyzeLegalDocument, extractTextFromImage, chatWithDocument,compareLegalDocuments } from "./src/services/geminiService";
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
import crypto from "crypto";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
  // Connect to MongoDB
  const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/clausebreaker";
  mongoose.connect(MONGO_URI)
    .then(() => console.log(">>> Connected to MongoDB Atlas!"))
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

      // THIS FIXES THE PDF UPLOAD CRASH
      if (mimeType === "application/pdf") {
        const pdfModule = require("pdf-parse");
        try {
          if (typeof pdfModule === 'function') {
            const data = await pdfModule(req.file.buffer);
            text = data.text;
          } else if (pdfModule.PDFParse) {
            const parser = new pdfModule.PDFParse({ data: req.file.buffer });
            const data = await parser.getText();
            text = data.text;
          }
        } catch (pdfErr) {
          console.error("PDF extraction failed:", pdfErr);
          throw new Error("Could not read PDF text");
        }
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

      const analysis = await analyzeLegalDocument(text, language);
      res.json(analysis);
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to analyze document" });
    }
  });

  // API Route for the Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { question, documentText, history } = req.body;

      if (!question || !documentText) {
        return res.status(400).json({ error: "Missing question or document text" });
      }

      // Safely call the backend service
      const answer = await chatWithDocument(question, documentText, history);
      res.json({ answer });
    } catch (error) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: "Failed to get chat response" });
    }
  });
  // API Route for Document Comparison
  app.post("/api/compare", async (req, res) => {
    try {
      const { text1, text2, language } = req.body;

      if (!text1 || !text2) {
        return res.status(400).json({ error: "Missing document text for comparison" });
      }

      // Safely call the backend service
      const comparison = await compareLegalDocuments(text1, text2, language);
      res.json(comparison);
    } catch (error) {
      console.error("Comparison API Error:", error);
      res.status(500).json({ error: "Failed to compare documents" });
    }
  });
  
  // Share Analysis
  app.post("/api/share", async (req, res) => {
    try {
      const { summary, overallRisk, clauses } = req.body;

      // Using crypto exclusively to avoid 'nanoid' ESM import crashes
      const shareId = crypto.randomBytes(5).toString('hex');
      const password = crypto.randomBytes(3).toString('hex');

      const newReport = new Report({
        shareId,
        password,
        data: { summary, overallRisk, clauses }
      });

      await newReport.save();

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
      if (!report.data) {
        return res.status(404).send("Report data is missing or corrupted");
      }

      const doc = new PDFDocument();
      const filename = `ClauseBreaker_Analysis_${id}.pdf`;

      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      doc.fontSize(24).font('Helvetica-Bold').text("CLAUSEBREAKER AI - LEGAL ANALYSIS", { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text("EXECUTIVE SUMMARY");
      doc.fontSize(11).font('Helvetica').text(report.data.summary || "No summary available.");
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text(`OVERALL RISK: ${(report.data.overallRisk || "UNKNOWN").toUpperCase()}`);
      doc.moveDown(2);

      doc.fontSize(16).font('Helvetica-Bold').text("CLAUSE BREAKDOWN");
      doc.moveDown();

      // @ts-ignore
      report.data.clauses.forEach((clause, i) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`[${i + 1}] ${clause.risk?.toUpperCase()} RISK`);
        doc.fontSize(10).font('Helvetica-Oblique').text(`Origin: ${(clause.text || "Original text unavailable").substring(0, 100)}...`);
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text("Simplified:");
        doc.fontSize(10).font('Helvetica').text(clause.simplified || "N/A");
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text("Advice:");
       doc.fontSize(10).font('Helvetica').text(clause.simplified || "N/A");
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