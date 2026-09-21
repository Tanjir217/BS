import {
    useEffect,
    useState,
  } from "react";
  
  import {
    Link,
    useLocation,
    useNavigate,
  } from "react-router-dom";
  
  import { useCustomerAuth } from "../../context/CustomerAuthContext";
  
  function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
  
    const {
      signIn,
      isAuthenticated,
      loading,
    } = useCustomerAuth();
  
    const [email, setEmail] =
      useState("");
  
    const [password, setPassword] =
      useState("");
  
    const [error, setError] =
      useState("");
  
    const [submitting, setSubmitting] =
      useState(false);
  
    const redirectTo =
      location.state?.from ||
      "/account";
  
    useEffect(() => {
      if (
        !loading &&
        isAuthenticated
      ) {
        navigate(
          redirectTo,
          { replace: true },
        );
      }
    }, [
      loading,
      isAuthenticated,
      navigate,
      redirectTo,
    ]);
  
    async function handleSubmit(event) {
      event.preventDefault();
  
      setError("");
      setSubmitting(true);
  
      try {
        await signIn(
          email,
          password,
        );
  
        navigate(
          redirectTo,
          { replace: true },
        );
      } catch (error) {
        setError(
          error?.message ||
            "Unable to sign in. Please check your email and password.",
        );
      } finally {
        setSubmitting(false);
      }
    }
  
    if (
      loading ||
      isAuthenticated
    ) {
      return null;
    }
  
    return (
      <main className="account-page">
        <div className="account-page__container">
          <div className="account-page__intro">
            <p>
              Bayzid Shoes
            </p>
  
            <h1>
              Welcome back.
            </h1>
  
            <span>
              Sign in to access your account,
              orders and saved information.
            </span>
          </div>
  
          <form
            className="account-form"
            onSubmit={handleSubmit}
          >
            <label>
              <span>
                Email
              </span>
  
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                autoComplete="email"
                required
              />
            </label>
  
            <label>
              <span>
                Password
              </span>
  
              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                autoComplete="current-password"
                required
              />
            </label>
  
            {error && (
              <p className="account-form__error">
                {error}
              </p>
            )}
  
            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Signing in..."
                : "Sign In"}
            </button>
  
            <p>
              Don't have an account?{" "}
              <Link
                to="/account/register"
                state={{
                  from: redirectTo,
                }}
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </main>
    );
  }
  
  export default LoginPage;