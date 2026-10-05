import workwaveLogo from "../assets/workwave-logo.png";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import ExcelJS from "exceljs";

import {
  FileSpreadsheet,
  Sparkles,
  Trash2,
  Plus,
  Download,
  ClipboardPaste,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowDownToLine,
  Database,
  RefreshCw,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const columns = [
  { key: "name", label: "Name" },
  { key: "experience", label: "Experience" },
  { key: "current_salary", label: "Salary" },
  { key: "location", label: "Location" },

  { key: "current_designation", label: "Current Designation" },

  {
    key: "standardized_designation",
    label: "Standardized Designation",
  },

  { key: "current_company", label: "Current Company" },

  { key: "previous_designation", label: "Previous Designation" },

  {
    key: "standardized_previous_designation",
    label: "Standardized Previous Designation",
  },

  { key: "previous_company", label: "Previous Company" },
  { key: "education", label: "Education" },
  { key: "preferred_locations", label: "Preferred Locations" },
  { key: "key_skills", label: "Key Skills" },
  { key: "additional_skills", label: "Additional Skills" },
  { key: "profile", label: "Profile" },
  { key: "phone", label: "Phone" },
];

const createEmptyCandidate = () => ({
  name: "",
  experience: "",
  current_salary: "",
  location: "",

  current_designation: "",
  standardized_designation: "",
  current_company: "",

  previous_designation: "",
  standardized_previous_designation: "",
  previous_company: "",

  education: "",
  preferred_locations: [],
  key_skills: [],
  additional_skills: [],
  profile: "",
  phone: "",
});

function Dashboard() {
  const navigate = useNavigate();

  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [databaseLoading, setDatabaseLoading] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [databaseCandidates, setDatabaseCandidates] = useState([]);
  const [showDatabase, setShowDatabase] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // CLEAR INPUT
  // =====================================================

  const handleClear = () => {
    setRawText("");
    setCandidates([]);
    setError("");
  };

  // =====================================================
  // EXTRACT CANDIDATES
  // =====================================================

  const handleExtract = async () => {
    if (!rawText.trim()) {
      setError("Please paste candidate information first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCandidates([]);

      const response = await axios.post(
        "https://candidate-data-extractor-api.onrender.com/api/extract",
        // "http://localhost:8000/api/extract",
        {
          text: rawText,
        }
      );

      setCandidates(response.data.candidates || []);
    } catch (error) {
      console.error("Extraction error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UPDATE TABLE CELL
  // =====================================================

  const updateCell = (candidateIndex, key, value) => {
    setCandidates((currentCandidates) => {
      const updatedCandidates = [...currentCandidates];

      updatedCandidates[candidateIndex] = {
        ...updatedCandidates[candidateIndex],
        [key]: value,
      };

      return updatedCandidates;
    });
  };

  // =====================================================
  // ADD CANDIDATE
  // =====================================================

  const addCandidate = () => {
    setCandidates((currentCandidates) => [
      ...currentCandidates,
      createEmptyCandidate(),
    ]);
  };

  // =====================================================
  // DELETE CURRENT CANDIDATE
  // =====================================================

  const deleteCandidate = (candidateIndex) => {
    setCandidates((currentCandidates) =>
      currentCandidates.filter(
        (_, index) => index !== candidateIndex
      )
    );
  };

  // =====================================================
  // DISPLAY ARRAY VALUES
  // =====================================================

  const getDisplayValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    return value || "";
  };

  // =====================================================
  // SAVE TO DATABASE
  // =====================================================

  const handleSaveToDatabase = async () => {
  if (candidates.length === 0) {
    setError("There are no candidates to save.");
    return;
  }

  try {
    setDatabaseLoading(true);
    setError("");

    const response = await axios.post(
  `${API_URL}/api/candidates/save`,
  {
    candidates,
  }
);

    alert(
      `${response.data.count} candidates saved to database successfully.`
    );

    // IMPORTANT:
    // Do NOT fetch or display the database here.
    // The database is accessed separately through
    // the Database button in the header.

  } catch (error) {
    console.error("Database save error:", error);

    setError(
      error.response?.data?.message ||
        "Unable to save candidates to database."
    );
  } finally {
    setDatabaseLoading(false);
  }
};

  // =====================================================
  // FETCH DATABASE
  // =====================================================

  const fetchDatabaseCandidates = async () => {
    try {
      setDatabaseLoading(true);
      setError("");

      const response = await axios.get(
  `${API_URL}/api/candidates`
);

      setDatabaseCandidates(
        response.data.candidates || []
      );

      setShowDatabase(true);
    } catch (error) {
      console.error(
        "Database fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to fetch candidates from database."
      );
    } finally {
      setDatabaseLoading(false);
    }
  };

  // =====================================================
  // VIEW DATABASE
  // =====================================================

  const handleViewDatabase = async () => {
    await fetchDatabaseCandidates();
  };

  // =====================================================
  // HIDE DATABASE
  // =====================================================

  const handleHideDatabase = () => {
    setShowDatabase(false);
  };

  // =====================================================
  // DELETE SAVED CANDIDATE
  // =====================================================

  const handleDeleteSavedCandidate = async (
    candidateId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this candidate from the database?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDatabaseLoading(true);
      setError("");

      await axios.delete(
        `${API_URL}/api/candidates/${candidateId}`
      );

      setDatabaseCandidates(
        (currentCandidates) =>
          currentCandidates.filter(
            (candidate) =>
              candidate._id !== candidateId
          )
      );
    } catch (error) {
      console.error(
        "Database delete error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to delete candidate from database."
      );
    } finally {
      setDatabaseLoading(false);
    }
  };

  // =====================================================
  // DOWNLOAD CURRENT EXCEL
  // =====================================================

  const handleDownloadExcel = async () => {
    if (candidates.length === 0) return;

    try {
      const workbook = new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet("Candidates");

      worksheet.columns = columns.map((column) => ({
        header: column.label,
        key: column.key,
        width: 25,
      }));

      candidates.forEach((candidate) => {
        const row = {};

        columns.forEach((column) => {
          row[column.key] = getDisplayValue(
            candidate[column.key]
          );
        });

        worksheet.addRow(row);
      });

      const headerRow = worksheet.getRow(1);

      headerRow.font = {
        bold: true,
        color: { argb: "FFFFFF" },
      };

      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1769C2" },
      };

      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      headerRow.height = 28;

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
            left: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
            bottom: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
            right: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
          };

          cell.alignment = {
            vertical: "top",
            wrapText: true,
          };
        });
      });

      worksheet.views = [
        {
          state: "frozen",
          ySplit: 1,
        },
      ];

      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "WorkWave_Candidate_Data.xlsx";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Excel export error:",
        error
      );

      setError(
        "Failed to generate Excel file."
      );
    }
  };

  // =====================================================
  // DOWNLOAD SAVED CANDIDATES EXCEL
  // =====================================================

  const handleDownloadDatabaseExcel = async () => {
    if (databaseCandidates.length === 0) {
      setError(
        "There are no saved candidates to download."
      );

      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet("Saved Candidates");

      worksheet.columns = columns.map((column) => ({
        header: column.label,
        key: column.key,
        width: 25,
      }));

      databaseCandidates.forEach((candidate) => {
        const row = {};

        columns.forEach((column) => {
          row[column.key] = getDisplayValue(
            candidate[column.key]
          );
        });

        worksheet.addRow(row);
      });

      // Header styling
      const headerRow = worksheet.getRow(1);

      headerRow.font = {
        bold: true,
        color: { argb: "FFFFFF" },
      };

      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1769C2" },
      };

      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      headerRow.height = 28;

      // Cell styling
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
            left: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
            bottom: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
            right: {
              style: "thin",
              color: { argb: "D9E2EC" },
            },
          };

          cell.alignment = {
            vertical: "top",
            wrapText: true,
          };
        });
      });

      // Freeze header row
      worksheet.views = [
        {
          state: "frozen",
          ySplit: 1,
        },
      ];

      // Generate Excel file
      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "WorkWave_Saved_Candidates.xlsx";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Saved Excel export error:",
        error
      );

      setError(
        "Failed to generate saved candidates Excel file."
      );
    }
  };

  return (
    <div className="ww-page">

      {/* ================= HEADER ================= */}

      <header className="ww-header">
        <div className="ww-header-inner">

          <div className="ww-brand">
            <div className="ww-logo">
              <img
                src={workwaveLogo}
                alt="WorkWave Global"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">

  <button
    onClick={() => navigate("/database")}
    className="ww-database-button"
  >
    <Database size={18} />
    <span>Database</span>
  </button>

  <div className="ww-tool-label">
    <span className="ww-status-dot"></span>
    Internal Tool
  </div>

</div>

        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="ww-main">

        {/* ================= HERO ================= */}

        <section className="ww-hero">

          <div className="ww-hero-decoration ww-decoration-one"></div>

          <div className="ww-hero-decoration ww-decoration-two"></div>

          <div className="ww-hero-content">

            <h1>
              Candidate Dataset Extractor
            </h1>

            <p>
              Turn candidate information into a structured dataset
            </p>

          </div>

        </section>

        {/* ================= INPUT CARD ================= */}

        <section className="ww-card ww-input-card">

          <div className="ww-card-header">

            <div className="ww-card-title-group">

              <div className="ww-icon-box">
                <ClipboardPaste size={21} />
              </div>

              <div>
                <h2>
                  Candidate Information
                </h2>

                <p>
                  Paste the candidate information copied from your
                  recruitment platform below.
                </p>
              </div>

            </div>

            {rawText.length > 0 && (
              <div className="ww-character-count">
                {rawText.length.toLocaleString()} characters
              </div>
            )}

          </div>

          <div className="ww-input-area">

            <textarea
              value={rawText}
              onChange={(event) =>
                setRawText(event.target.value)
              }
              className="ww-textarea"
              placeholder="Paste candidate information here..."
            />

            <div className="ww-input-footer">

              <div className="ww-input-hint">

                <ClipboardPaste size={15} />

                <span>
                  Paste the complete candidate page content
                </span>

              </div>

              <div className="ww-input-actions">

                {rawText.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="ww-secondary-button"
                  >
                    <Trash2 size={15} />
                    Clear
                  </button>
                )}

                <button
                  onClick={handleExtract}
                  disabled={
                    !rawText.trim() ||
                    loading
                  }
                  className="ww-primary-button"
                >
                  <Sparkles size={16} />

                  {loading
                    ? "Extracting..."
                    : "Extract Candidates"}

                </button>

              </div>

            </div>

          </div>

        </section>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="ww-loading">

            <div className="ww-spinner"></div>

            <div>
              <strong>
                Extracting candidates
              </strong>

              <span>
                Processing the information and creating structured records...
              </span>
            </div>

          </div>
        )}

        {/* ================= ERROR ================= */}

        {error && (
          <div className="ww-error">

            <div className="ww-error-icon">
              <AlertCircle size={20} />
            </div>

            <div>
              <strong>
                Something went wrong
              </strong>

              <p>{error}</p>
            </div>

          </div>
        )}

        {/* =====================================================
            EXTRACTED CANDIDATES
        ===================================================== */}

        {candidates.length > 0 && (
          <section className="ww-results">

            <div className="ww-results-header">

              <div>

                <div className="ww-eyebrow">
                  <CheckCircle2 size={15} />
                  Extraction Complete
                </div>

                <h2>
                  Extracted Candidates
                </h2>

                <p>
                  Review and edit the extracted records before
                  saving or downloading the dataset.
                </p>

              </div>

              <div className="ww-result-count">

                <Users size={20} />

                <div>
                  <strong>
                    {candidates.length}
                  </strong>

                  <span>
                    Candidates
                  </span>
                </div>

              </div>

            </div>

            {/* ================= TABLE ================= */}

            <div className="ww-table-wrapper">

              <div className="ww-table-scroll">

                <table className="ww-table">

                  <thead>
                    <tr>

                      <th className="ww-number-column">
                        #
                      </th>

                      {columns.map(
                        (column) => (
                          <th
                            key={column.key}
                          >
                            {column.label}
                          </th>
                        )
                      )}

                      <th className="ww-action-column">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {candidates.map(
                      (candidate, index) => (
                        <tr key={index}>

                          <td className="ww-row-number">
                            {index + 1}
                          </td>

                          {columns.map(
                            (column) => (
                              <td
                                key={column.key}
                              >
                                <input
                                  type="text"
                                  value={getDisplayValue(
                                    candidate[
                                      column.key
                                    ]
                                  )}
                                  onChange={(
                                    event
                                  ) =>
                                    updateCell(
                                      index,
                                      column.key,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                />
                              </td>
                            )
                          )}

                          <td className="ww-action-cell">

                            <button
                              onClick={() =>
                                deleteCandidate(
                                  index
                                )
                              }
                              className="ww-delete-button"
                              title="Delete candidate"
                            >
                              <Trash2 size={17} />
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* ================= ACTION BUTTONS ================= */}

            <div className="ww-results-actions">

              <button
                onClick={addCandidate}
                className="ww-secondary-button"
                disabled={
                  loading ||
                  databaseLoading
                }
              >
                <Plus size={16} />
                Add Candidate
              </button>

              <button
                onClick={handleSaveToDatabase}
                className="ww-secondary-button"
                disabled={
                  loading ||
                  databaseLoading
                }
              >
                <Database size={17} />

                {databaseLoading
                  ? "Saving..."
                  : "Save to Database"}
              </button>
{/* 
              <button
                onClick={handleViewDatabase}
                className="ww-secondary-button"
                disabled={
                  loading ||
                  databaseLoading
                }
              >
                <Users size={17} />

                {databaseLoading
                  ? "Loading..."
                  : "View Database"}
              </button> */}

              <button
                onClick={handleDownloadExcel}
                className="ww-download-button"
                disabled={
                  loading ||
                  databaseLoading
                }
              >
                <ArrowDownToLine size={17} />
                Download Excel
              </button>

            </div>

          </section>
        )}

        {/* =====================================================
            DATABASE SECTION
        ===================================================== */}

        {showDatabase && (
          <section className="ww-results">

            {/* ================= DATABASE HEADER ================= */}

            <div className="ww-results-header">

              <div>

                <div className="ww-eyebrow">
                  <Database size={15} />
                  Database
                </div>

                <h2>
                  Saved Candidates
                </h2>

                <p>
                  All candidates currently stored in the
                  WorkWave database.
                </p>

              </div>

              <div className="ww-result-count">

                <Users size={20} />

                <div>

                  <strong>
                    {databaseCandidates.length}
                  </strong>

                  <span>
                    Candidates
                  </span>

                </div>

              </div>

            </div>

            {/* ================= DATABASE ACTIONS ================= */}

            <div
              className="ww-results-actions"
              style={{
                marginBottom: "20px",
              }}
            >

              <button
                onClick={fetchDatabaseCandidates}
                className="ww-secondary-button"
                disabled={databaseLoading}
              >

                <RefreshCw
                  size={16}
                  className={
                    databaseLoading
                      ? "ww-spin"
                      : ""
                  }
                />

                Refresh Database

              </button>

              <button
                onClick={handleDownloadDatabaseExcel}
                className="ww-download-button"
                disabled={
                  databaseLoading ||
                  databaseCandidates.length === 0
                }
              >

                <Download size={16} />

                Download Saved Excel

              </button>

              <button
                onClick={handleHideDatabase}
                className="ww-secondary-button"
                disabled={databaseLoading}
              >

                <X size={16} />

                Hide Database

              </button>

            </div>

            {/* ================= DATABASE TABLE ================= */}

            {databaseCandidates.length > 0 ? (

              <div className="ww-table-wrapper">

                <div className="ww-table-scroll">

                  <table className="ww-table">

                    <thead>

                      <tr>

                        <th className="ww-number-column">
                          #
                        </th>

                        {columns.map(
                          (column) => (
                            <th
                              key={column.key}
                            >
                              {column.label}
                            </th>
                          )
                        )}

                        <th className="ww-action-column">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {databaseCandidates.map(
                        (
                          candidate,
                          index
                        ) => (

                          <tr
                            key={
                              candidate._id ||
                              index
                            }
                          >

                            <td className="ww-row-number">
                              {index + 1}
                            </td>

                            {columns.map(
                              (column) => (

                                <td
                                  key={
                                    column.key
                                  }
                                >

                                  <input
                                    type="text"
                                    value={getDisplayValue(
                                      candidate[
                                        column.key
                                      ]
                                    )}
                                    readOnly
                                  />

                                </td>

                              )
                            )}

                            {/* DELETE SAVED CANDIDATE */}

                            <td className="ww-action-cell">

                              <button
                                onClick={() =>
                                  handleDeleteSavedCandidate(
                                    candidate._id
                                  )
                                }
                                className="ww-delete-button"
                                title="Delete candidate permanently"
                                disabled={
                                  databaseLoading
                                }
                              >

                                <Trash2 size={17} />

                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            ) : (

              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                }}
              >

                <Database size={40} />

                <h3>
                  No candidates found
                </h3>

                <p>
                  There are currently no candidates
                  saved in the database.
                </p>

              </div>

            )}

          </section>
        )}

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="ww-footer">

        <div>
          WORKWAVE <span>GLOBAL</span>
        </div>

        <p>
          Connecting People, Empowering Futures
        </p>

      </footer>

    </div>
  );
}

export default Dashboard;