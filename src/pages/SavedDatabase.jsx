import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ExcelJS from "exceljs";

import {
  Database,
  Users,
  RefreshCw,
  Download,
  Trash2,
  LogOut,
  Save,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

/* =====================================================
   COLUMNS
===================================================== */

const columns = [
  {
    key: "name",
    label: "Name",
    width: 220,
  },

  {
    key: "experience",
    label: "Experience",
    width: 150,
  },

  {
    key: "current_salary",
    label: "Salary",
    width: 150,
  },

  {
    key: "location",
    label: "Location",
    width: 220,
  },

  {
    key: "current_designation",
    label: "Current Designation",
    width: 260,
  },

  {
    key: "standardized_designation",
    label: "Standardized Designation",
    width: 240,
  },

  {
    key: "current_company",
    label: "Current Company",
    width: 260,
  },

  {
    key: "previous_designation",
    label: "Previous Designation",
    width: 260,
  },

  {
    key: "standardized_previous_designation",
    label: "Standardized Previous Designation",
    width: 260,
  },

  {
    key: "previous_company",
    label: "Previous Company",
    width: 260,
  },

  {
    key: "education",
    label: "Education",
    width: 260,
  },

  {
    key: "preferred_locations",
    label: "Preferred Locations",
    width: 280,
  },

  {
    key: "key_skills",
    label: "Key Skills",
    width: 350,
  },

  {
    key: "additional_skills",
    label: "Additional Skills",
    width: 350,
  },

  {
    key: "profile",
    label: "Profile",
    width: 400,
  },

  {
    key: "phone",
    label: "Phone",
    width: 180,
  },
];

/* =====================================================
   ARRAY FIELDS
===================================================== */

const arrayFields = [
  "preferred_locations",
  "key_skills",
  "additional_skills",
];

/* =====================================================
   DISPLAY VALUE
===================================================== */

const getDisplayValue = (value) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value ?? "";
};

/* =====================================================
   CONVERT FOR DATABASE
===================================================== */

const convertForDatabase = (candidate) => {
  const updatedCandidate = {};

  columns.forEach((column) => {
    const value = candidate[column.key];

    if (arrayFields.includes(column.key)) {
      if (Array.isArray(value)) {
        updatedCandidate[column.key] = value;
      } else {
        updatedCandidate[column.key] = value
          ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];
      }
    } else {
      updatedCandidate[column.key] = value ?? "";
    }
  });

  return updatedCandidate;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function SavedDatabase() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);

  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =====================================================
     AUTH CHECK
  ===================================================== */

  useEffect(() => {
    const authenticated = sessionStorage.getItem(
      "databaseAuthenticated"
    );

    if (authenticated !== "true") {
      navigate("/database");
      return;
    }

    fetchCandidates();
  }, [navigate]);

  /* =====================================================
     FETCH DATABASE
  ===================================================== */

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/candidates`
      );

      setCandidates(
        response.data.candidates || []
      );
    } catch (error) {
      console.error(
        "Database fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load candidates."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     UPDATE CELL LOCALLY
  ===================================================== */

  const handleCellChange = (
    candidateId,
    key,
    value
  ) => {
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) => {
        if (candidate._id !== candidateId) {
          return candidate;
        }

        return {
          ...candidate,
          [key]: value,
        };
      })
    );

    setSuccess("");
  };

  /* =====================================================
     SAVE ONE CANDIDATE
  ===================================================== */

  const handleSaveCandidate = async (
    candidate
  ) => {
    try {
      setSavingId(candidate._id);

      setError("");

      setSuccess("");

      const updatedCandidate =
        convertForDatabase(candidate);

      const response = await axios.put(
        `${API_URL}/api/candidates/${candidate._id}`,
        updatedCandidate
      );

      setCandidates((currentCandidates) =>
        currentCandidates.map((item) =>
          item._id === candidate._id
            ? response.data.candidate
            : item
        )
      );

      setSuccess(
        `${candidate.name || "Candidate"} updated successfully.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Candidate update error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to save changes."
      );
    } finally {
      setSavingId(null);
    }
  };

  /* =====================================================
     DELETE CANDIDATE
  ===================================================== */

  const handleDeleteCandidate = async (
    candidateId,
    candidateName
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${
        candidateName || "this candidate"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(candidateId);

      setError("");

      setSuccess("");

      await axios.delete(
        `${API_URL}/api/candidates/${candidateId}`
      );

      setCandidates((currentCandidates) =>
        currentCandidates.filter(
          (candidate) =>
            candidate._id !== candidateId
        )
      );

      setSuccess(
        "Candidate deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Candidate delete error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to delete candidate."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    sessionStorage.removeItem(
      "databaseAuthenticated"
    );

    navigate("/database");
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredCandidates = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      return columns.some((column) => {
        const value = getDisplayValue(
          candidate[column.key]
        );

        return value
          .toLowerCase()
          .includes(searchValue);
      });
    });
  }, [candidates, search]);

  /* =====================================================
     DOWNLOAD EXCEL
  ===================================================== */

  const handleDownloadExcel = async () => {
    if (candidates.length === 0) {
      setError(
        "There are no candidates to download."
      );

      return;
    }

    try {
      const workbook =
        new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet(
          "Saved Candidates"
        );

      worksheet.columns = columns.map(
        (column) => ({
          header: column.label,
          key: column.key,
          width: 25,
        })
      );

      candidates.forEach((candidate) => {
        const row = {};

        columns.forEach((column) => {
          row[column.key] =
            getDisplayValue(
              candidate[column.key]
            );
        });

        worksheet.addRow(row);
      });

      const headerRow =
        worksheet.getRow(1);

      headerRow.font = {
        bold: true,
        color: {
          argb: "FFFFFF",
        },
      };

      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "1769C2",
        },
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
              color: {
                argb: "D9E2EC",
              },
            },

            left: {
              style: "thin",
              color: {
                argb: "D9E2EC",
              },
            },

            bottom: {
              style: "thin",
              color: {
                argb: "D9E2EC",
              },
            },

            right: {
              style: "thin",
              color: {
                argb: "D9E2EC",
              },
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
        "WorkWave_Saved_Candidates.xlsx";

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

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw
            size={20}
            className="animate-spin"
          />

          Loading saved candidates...
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">

        <div className="max-w-[1800px] mx-auto px-6 py-4">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-4">

              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft size={18} />

                Dashboard
              </button>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">

                  <Database
                    size={21}
                    className="text-blue-600"
                  />

                </div>

                <div>

                  <h1 className="text-lg font-bold text-slate-900">
                    Saved Database
                  </h1>

                  <p className="text-xs text-slate-500">
                    WorkWave Candidate Database
                  </p>

                </div>

              </div>

            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <LogOut size={17} />

              Lock Database
            </button>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="max-w-[1800px] mx-auto px-6 py-8">

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">

          <div>

            <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-2">

              <Users size={16} />

              Saved Candidates

            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              Candidate Database
            </h2>

            <p className="text-slate-500 mt-2">
              Edit candidate information directly and save
              changes to the database.
            </p>

          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-5 py-3">

            <Users
              size={20}
              className="text-blue-600"
            />

            <div>

              <div className="font-bold text-slate-900">
                {candidates.length}
              </div>

              <div className="text-xs text-slate-500">
                Total Candidates
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">

            <AlertCircle
              size={20}
              className="mt-0.5 flex-shrink-0"
            />

            <div className="text-sm">
              {error}
            </div>

          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">

            <CheckCircle2
              size={20}
              className="mt-0.5 flex-shrink-0"
            />

            <div className="text-sm">
              {success}
            </div>

          </div>
        )}

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">

          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

            {/* SEARCH */}

            <div className="relative flex-1 max-w-xl">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search candidates..."
                className="w-full border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap gap-2">

              <button
                onClick={fetchCandidates}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              >

                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh

              </button>

              <button
                onClick={handleDownloadExcel}
                disabled={
                  candidates.length === 0
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 transition"
              >

                <Download size={16} />

                Download Excel

              </button>

            </div>

          </div>

          {search && (
            <div className="mt-3 text-sm text-slate-500">

              Showing{" "}

              <strong className="text-slate-700">
                {filteredCandidates.length}
              </strong>

              {" "}of{" "}

              <strong className="text-slate-700">
                {candidates.length}
              </strong>

              {" "}candidates

            </div>
          )}

        </div>

        {/* =================================================
            DATABASE TABLE
        ================================================= */}

        {filteredCandidates.length === 0 ? (

          <div className="ww-table-wrapper">

            <div className="py-20 text-center">

              <Database
                size={42}
                className="mx-auto text-slate-300 mb-4"
              />

              <h3 className="text-lg font-semibold text-slate-700">
                No candidates found
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                {search
                  ? "Try a different search."
                  : "There are no candidates in the database."}
              </p>

            </div>

          </div>

        ) : (

          /* =================================================
             SAME TABLE STRUCTURE AS EXTRACTED CANDIDATES
          ================================================= */

          <div className="ww-table-wrapper">

            <div className="ww-table-scroll">

              <table className="ww-table">

                <thead>

                  <tr>

                    <th className="ww-number-column">
                      #
                    </th>

                    {columns.map((column) => (
                      <th key={column.key}>
                        {column.label}
                      </th>
                    ))}

                    <th className="ww-action-column">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredCandidates.map(
                    (candidate, index) => (

                      <tr
                        key={candidate._id}
                      >

                        {/* NUMBER */}

                        <td className="ww-row-number">
                          {index + 1}
                        </td>

                        {/* DATA */}

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
                                onChange={(event) =>
                                  handleCellChange(
                                    candidate._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                              />

                            </td>

                          )
                        )}

                        {/* ACTION */}

                        <td className="ww-action-cell">

                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              gap: "8px",
                            }}
                          >

                            {/* SAVE */}

                            <button
                              onClick={() =>
                                handleSaveCandidate(
                                  candidate
                                )
                              }
                              disabled={
                                savingId ===
                                candidate._id
                              }
                              className="ww-save-button"
                              title="Save changes"
                            >

                              {savingId ===
                              candidate._id ? (
                                <RefreshCw
                                  size={16}
                                  className="ww-spin"
                                />
                              ) : (
                                <Save
                                  size={16}
                                />
                              )}

                            </button>

                            {/* DELETE */}

                            <button
                              onClick={() =>
                                handleDeleteCandidate(
                                  candidate._id,
                                  candidate.name
                                )
                              }
                              disabled={
                                deletingId ===
                                candidate._id
                              }
                              className="ww-delete-button"
                              title="Delete candidate"
                            >

                              {deletingId ===
                              candidate._id ? (
                                <RefreshCw
                                  size={16}
                                  className="ww-spin"
                                />
                              ) : (
                                <Trash2
                                  size={17}
                                />
                              )}

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}