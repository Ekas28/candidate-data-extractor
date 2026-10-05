const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
  
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Lock, ArrowLeft, Database } from "lucide-react";

export default function DatabasePassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
  `${API_URL}/api/database/login`,
  {
    password,
  }
);

      if (response.data.success) {
        // Store access only for this browser session
        sessionStorage.setItem(
          "databaseAuthenticated",
          "true"
        );

        navigate("/database/saved");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to access database."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Database
                size={30}
                className="text-blue-600"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-7">

            <h1 className="text-2xl font-bold text-slate-900">
              Saved Database
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Enter the password to access saved candidates.
            </p>

          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Database Password
            </label>

            <div className="relative">

              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter password"
                className="w-full border border-slate-300 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                autoFocus
              />

            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl transition"
            >
              {loading
                ? "Verifying..."
                : "Access Database"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}