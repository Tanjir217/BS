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
  
  function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
  
    const {
      signUp,
      isAuthenticated,
      loading,
    } = useCustomerAuth();
  
    const [name, setName] =
      useState("");
  
    const [email, setEmail] =
      useState("");
  
    const [password, setPassword] =
      useState("");
  
    const [confirmPassword, setConfirmPassword] =
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
  
      if (
        password !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match.",
        );
  
        return;
      }
  
      if (password.length < 8) {
        setError(
          "Password must be at least 8 characters.",
        );
  
        return;
      }
  
      setSubmitting(true);
  
      try {
        await signUp({
          name,
          email,
          password,
        });
  
        navigate(
          redirectTo,
          { replace: true },
        );
      } catch (error) {
        setError(
          error?.message ||
            "Unable to create your account.",
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
              Create your account.
            </h1>
  
            <span>
              Save your information and
              manage your orders in one place.
            </span>
          </div>
  
          <form
            className="account-form"
            onSubmit={handleSubmit}
          >
            <label>
              <span>
                Full Name
              </span>
  
              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                autoComplete="name"
                required
              />
            </label>
  
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
                autoComplete="new-password"
                required
              />
            </label>
  
            <label>
              <span>
                Confirm Password
              </span>
  
              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
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
                ? "Creating account..."
                : "Create Account"}
            </button>
  
            <p>
              Already have an account?{" "}
              <Link
                to="/account/login"
                state={{
                  from: redirectTo,
                }}
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    );
  }
  
  export default RegisterPage;