const express = require("express");
const cors = require("cors");

const candidateSchema = require("./schemas/candidateSchema");

const {
  cleanText,
  splitCandidates,
  parseCandidate,
} = require("./services/candidateParser");

const app = express();

// Use Render's PORT in production, otherwise use 8000 locally
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

  // Check input
  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "No candidate data was provided",
    });
  }

  try {
    // Step 1: Clean the raw text
    const cleanedText = cleanText(text);

    // Step 2: Find individual candidate blocks
    const candidateBlocks = splitCandidates(cleanedText);

    // Step 3: Parse each candidate
    const candidates = candidateBlocks.map((candidateLines) =>
      parseCandidate(candidateLines)
    );

    // Log results in terminal
    console.log(`Detected ${candidates.length} candidates`);

    console.log(JSON.stringify(candidates, null, 2));

    // Send results back to frontend
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
