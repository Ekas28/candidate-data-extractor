require("dotenv").config();

const express = require("express");
const cors = require("cors");

const candidateSchema = require("./schemas/candidateSchema");

const {
  cleanText,
  splitCandidates,
  parseCandidate,
} = require("./services/candidateParser");

const {
  normalizeDesignations,
} = require("./services/designationNormalizer");

const {
  normalizePreviousDesignations,
} = require("./services/previousDesignationNormalizer");

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
app.post("/api/extract", async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "No candidate data was provided",
    });
  }

  try {
    // ----------------------------------------
    // STEP 1: Clean input
    // ----------------------------------------

    const cleanedText = cleanText(text);

    // ----------------------------------------
    // STEP 2: Split into candidate blocks
    // ----------------------------------------

    const candidateBlocks =
      splitCandidates(cleanedText);

    // ----------------------------------------
    // STEP 3: Extract candidate information
    // ----------------------------------------

    const candidates =
      candidateBlocks.map((candidateLines) =>
        parseCandidate(candidateLines)
      );

    // ----------------------------------------
    // DEBUG: CHECK DATA BEFORE AI
    // ----------------------------------------

    console.log("===== BEFORE AI =====");

    console.log(
      JSON.stringify(
        candidates.slice(0, 10),
        null,
        2
      )
    );

    console.log("====================");

    console.log(
      `Detected ${candidates.length} candidates`
    );

    // ----------------------------------------
    // STEP 4: Collect unique CURRENT designations
    // ----------------------------------------

    const uniqueDesignations = [
      ...new Set(
        candidates
          .map(
            (candidate) =>
              candidate.current_designation
          )
          .filter(Boolean)
          .map((designation) =>
            designation.trim()
          )
      ),
    ];

    console.log(
      `Found ${uniqueDesignations.length} unique current designations`
    );

    // ----------------------------------------
    // STEP 5: CURRENT DESIGNATION AI NORMALIZATION
    // ----------------------------------------

    let designationMapping = {};

    if (uniqueDesignations.length > 0) {
      console.log(
        "Sending current designations to AI for normalization..."
      );

      designationMapping =
        await normalizeDesignations(
          uniqueDesignations
        );

      console.log(
        "Current designation normalization completed."
      );

      console.log(
        JSON.stringify(
          designationMapping,
          null,
          2
        )
      );
    }

    // ----------------------------------------
    // STEP 5B: Collect unique PREVIOUS designations
    // ----------------------------------------

    const uniquePreviousDesignations = [
      ...new Set(
        candidates
          .map(
            (candidate) =>
              candidate.previous_designation
          )
          .filter(Boolean)
          .map((designation) =>
            designation.trim()
          )
      ),
    ];

    console.log(
      `Found ${uniquePreviousDesignations.length} unique previous designations`
    );

    // ----------------------------------------
    // STEP 5C: PREVIOUS DESIGNATION AI NORMALIZATION
    // ----------------------------------------

    let previousDesignationMapping = {};

    if (
      uniquePreviousDesignations.length > 0
    ) {
      console.log(
        "Sending previous designations to AI for normalization..."
      );

      previousDesignationMapping =
        await normalizePreviousDesignations(
          uniquePreviousDesignations
        );

      console.log(
        "Previous designation normalization completed."
      );

      console.log(
        JSON.stringify(
          previousDesignationMapping,
          null,
          2
        )
      );
    }

    // ----------------------------------------
    // STEP 6: Add standardized designations
    // ----------------------------------------

    const normalizedCandidates =
      candidates.map((candidate) => {

        // ------------------------------------
        // CURRENT DESIGNATION
        // ------------------------------------

        const originalDesignation =
          candidate.current_designation;

        const standardizedDesignation =
          originalDesignation
            ? designationMapping[
                originalDesignation.trim()
              ] || originalDesignation
            : null;

        // ------------------------------------
        // PREVIOUS DESIGNATION
        // ------------------------------------

        const originalPreviousDesignation =
          candidate.previous_designation;

        const standardizedPreviousDesignation =
          originalPreviousDesignation
            ? previousDesignationMapping[
                originalPreviousDesignation.trim()
              ] ||
              originalPreviousDesignation
            : null;

        // ------------------------------------
        // RETURN CANDIDATE
        // ------------------------------------

        return {
          ...candidate,

          // Original current designation
          // remains unchanged
          current_designation:
            originalDesignation,

          // AI standardized current designation
          standardized_designation:
            standardizedDesignation,

          // Original previous designation
          // remains unchanged
          previous_designation:
            originalPreviousDesignation,

          // AI standardized previous designation
          standardized_previous_designation:
            standardizedPreviousDesignation,
        };
      });

    // ----------------------------------------
    // STEP 7: Return dataset
    // ----------------------------------------

    console.log(
      `Returning ${normalizedCandidates.length} candidates`
    );

    res.json({
      success: true,

      count:
        normalizedCandidates.length,

      candidates:
        normalizedCandidates,
    });

  } catch (error) {

    console.error(
      "Extraction error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to process candidate data",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});