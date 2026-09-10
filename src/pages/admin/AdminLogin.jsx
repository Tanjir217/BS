import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginAdmin } from "../../services/authServices";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginAdmin(
        email,
        password
      );

      navigate("/admin", {
        replace: true,
      });
    } catch (requestError) {
      console.error(
        "Admin login failed:",
        requestError
      );

      setError(
        requestError?.message ||
          "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">
            Bayzid Shoes
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Admin Sign In
          </h1>

          <p className="mt-2 text-sm text-black/45">
            Sign in to access the store
            administration.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="admin-email"
              className="text-xs font-medium text-black/60"
            >
              Email
            </label>

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-black/25"
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="text-xs font-medium text-black/60"
            >
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-black/25"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <p className="text-xs text-red-600">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default AdminLogin;