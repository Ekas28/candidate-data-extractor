const Candidate = require("./models/Candidate");

require("dotenv").config();

const connectDB = require("./config/db");

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

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json({ limit: "5mb" }));

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.send("Candidate Data Extractor API is running!");
});

// =====================================================
// SCHEMA ENDPOINT
// =====================================================

app.get("/api/schema", (req, res) => {
  res.json({
    success: true,
    schema: candidateSchema,
  });
});

// =====================================================
// CANDIDATE EXTRACTION ENDPOINT
// =====================================================

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
          current_designation:
            originalDesignation,

          // AI standardized current designation
          standardized_designation:
            standardizedDesignation,

          // Original previous designation
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

// =====================================================
// CONNECT TO MONGODB
// =====================================================

connectDB();

// =====================================================
// DATABASE PASSWORD LOGIN
// =====================================================

app.post(
  "/api/database/login",
  async (req, res) => {

    try {

      const { password } = req.body;

      // ----------------------------------------
      // DEBUG - DO NOT PRINT ACTUAL PASSWORD
      // ----------------------------------------

      console.log(
        "Password received:",
        !!password
      );

      console.log(
        "DATABASE_PASSWORD loaded:",
        !!process.env.DATABASE_PASSWORD
      );

      // ----------------------------------------
      // CHECK PASSWORD WAS PROVIDED
      // ----------------------------------------

      if (!password) {

        return res.status(400).json({
          success: false,
          message: "Password is required",
        });

      }

      // ----------------------------------------
      // CHECK PASSWORD
      // ----------------------------------------

      if (
        password !==
        process.env.DATABASE_PASSWORD
      ) {

        return res.status(401).json({
          success: false,
          message: "Incorrect password",
        });

      }

      // ----------------------------------------
      // PASSWORD CORRECT
      // ----------------------------------------

      res.json({
        success: true,
        message:
          "Database access granted",
      });

    } catch (error) {

      console.error(
        "Database login error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Login failed",
      });

    }
  }
);

// =====================================================
// SAVE CANDIDATES TO DATABASE
// =====================================================

app.post(
  "/api/candidates/save",
  async (req, res) => {

    try {

      const { candidates } = req.body;

      if (
        !Array.isArray(candidates) ||
        candidates.length === 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "No candidates were provided",
        });

      }

      // -------------------------------------------------
      // TRACK SAVED AND DUPLICATE CANDIDATES
      // -------------------------------------------------

      let savedCandidates = [];

      let duplicateCount = 0;

      // -------------------------------------------------
      // CHECK EACH CANDIDATE
      // -------------------------------------------------

      for (const candidate of candidates) {

        const name =
          candidate.name?.trim();

        const phone =
          candidate.phone?.trim();

        let existingCandidate = null;

        // -------------------------------------------------
        // DUPLICATE CHECK
        // -------------------------------------------------
        //
        // A candidate is considered a duplicate ONLY
        // when BOTH name AND phone are the same.
        //
        // Same names are allowed.
        // -------------------------------------------------

        if (name && phone) {

          existingCandidate =
            await Candidate.findOne({
              name: name,
              phone: phone,
            });

        }

        // -------------------------------------------------
        // DUPLICATE FOUND
        // -------------------------------------------------

        if (existingCandidate) {

          duplicateCount++;

          continue;

        }

        // -------------------------------------------------
        // SAVE NEW CANDIDATE
        // -------------------------------------------------

        const newCandidate =
          await Candidate.create(
            candidate
          );

        savedCandidates.push(
          newCandidate
        );

      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      res.json({

        success: true,

        count:
          savedCandidates.length,

        duplicateCount:
          duplicateCount,

        message:
          `${savedCandidates.length} candidates saved successfully. ${duplicateCount} duplicates skipped.`,

      });

    } catch (error) {

      console.error(
        "Database save error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to save candidates to database",

      });

    }

  }
);

// =====================================================
// GET ALL SAVED CANDIDATES
// =====================================================

app.get(
  "/api/candidates",
  async (req, res) => {

    try {

      const candidates =
        await Candidate.find()
          .sort({ createdAt: 1 });

      res.json({

        success: true,

        count:
          candidates.length,

        candidates:
          candidates,

      });

    } catch (error) {

      console.error(
        "Database fetch error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to fetch candidates from database",

      });

    }

  }
);

// =====================================================
// UPDATE SAVED CANDIDATE
// =====================================================

app.put("/api/candidates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "name",
      "experience",
      "current_salary",
      "location",
      "current_designation",
      "standardized_designation",
      "current_company",
      "previous_designation",
      "standardized_previous_designation",
      "previous_company",
      "education",
      "preferred_locations",
      "key_skills",
      "additional_skills",
      "profile",
      "phone",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          field
        )
      ) {
        updateData[field] = req.body[field];
      }
    });

    const updatedCandidate =
      await Candidate.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedCandidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate updated successfully",
      candidate: updatedCandidate,
    });
  } catch (error) {
    console.error(
      "Database update error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update candidate",
    });
  }
});

// =====================================================
// DELETE SAVED CANDIDATE
// =====================================================

app.delete(
  "/api/candidates/:id",
  async (req, res) => {

    try {

      const { id } = req.params;

      const deletedCandidate =
        await Candidate.findByIdAndDelete(
          id
        );

      if (!deletedCandidate) {

        return res.status(404).json({

          success: false,

          message:
            "Candidate not found",

        });

      }

      res.json({

        success: true,

        message:
          "Candidate deleted successfully",

      });

    } catch (error) {

      console.error(
        "Database delete error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to delete candidate",

      });

    }

  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});