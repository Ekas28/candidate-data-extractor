const express = require("express");
const cors = require("cors");

const candidateSchema = require("./schemas/candidateSchema");

const {
  cleanText,
  splitCandidates,
  parseCandidate,
} = require("./services/candidateParser");

const app = express();

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("Candidate Data Extractor API is running!");
});

// Schema endpoint
app.get("/api/schema", (req, res) => {
  res.json({
    success: true,
    schema: candidateSchema,
  });
});

// Candidate extraction endpoint
app.post("/api/extract", (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "No candidate data was provided",
    });
  }

  try {
    const cleanedText = cleanText(text);

    const candidateBlocks = splitCandidates(cleanedText);

    const candidates = candidateBlocks.map((candidateLines) =>
      parseCandidate(candidateLines)
    );

    console.log(`Detected ${candidates.length} candidates`);

    console.log(JSON.stringify(candidates, null, 2));

    res.json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error("Parsing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to parse candidate data",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});