import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import cors from "cors";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // API Route for PDF parsing
  app.post("/api/parse-pdf", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Lazy load pdf-parse
      const pdfModule = require("pdf-parse");
      let text = "";

      try {
        if (typeof pdfModule === 'function') {
          const data = await pdfModule(req.file.buffer);
          text = data.text;
        } else if (pdfModule.default && typeof pdfModule.default === 'function') {
          const data = await pdfModule.default(req.file.buffer);
          text = data.text;
        } else {
          throw new Error("Could not find a valid PDF parser");
        }
      } catch (err) {
        console.error("PDF parsing error details:", err);
        throw new Error(`PDF parsing failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      res.json({ text });
    } catch (error) {
      console.error("PDF parsing error:", error);
      res.status(500).json({ error: "Failed to parse PDF" });
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
