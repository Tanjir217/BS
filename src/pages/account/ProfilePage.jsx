import {
    useEffect,
    useState,
  } from "react";
  
  import {
    Link,
    useNavigate,
  } from "react-router-dom";
  
  import { useCustomerAuth } from "../../context/CustomerAuthContext";
  
  function ProfilePage() {
    const navigate = useNavigate();
  
    const {
      user,
      loading,
      isAuthenticated,
    } = useCustomerAuth();
  
    const [name, setName] =
      useState("");
  
    const [phone, setPhone] =
      useState("");
  
    const [error, setError] =
      useState("");
  
    const [success, setSuccess] =
      useState("");
  
    const [saving, setSaving] =
      useState(false);
  
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate(
          "/account/login",
          {
            replace: true,
            state: {
              from: "/account/profile",
            },
          },
        );
      }
    }, [
      loading,
      isAuthenticated,
      navigate,
    ]);
  
    useEffect(() => {
      if (user) {
        setName(user.name || "");
      }
    }, [user]);
  
    async function handleSubmit(event) {
      event.preventDefault();
  
      setError("");
      setSuccess("");
  
      if (!name.trim()) {
        setError(
          "Name is required.",
        );
  
        return;
      }
  
      setSaving(true);
  
      try {
        /*
         * Appwrite profile update
         * will be connected through the
         * customer profile service.
         */
  
        setSuccess(
          "Profile updated successfully.",
        );
      } catch (error) {
        console.error(
          "Profile update failed:",
          error,
        );
  
        setError(
          error?.message ||
            "Unable to update your profile.",
        );
      } finally {
        setSaving(false);
      }
    }
  
    if (
      loading ||
      !isAuthenticated
    ) {
      return null;
    }
  
    return (
      <main className="account-page">
        <div className="account-page__container">
          <div className="account-page__intro">
            <p>
              My Account / Profile
            </p>
  
            <h1>
              Personal information.
            </h1>
  
            <span>
              Manage the information associated
              with your Bayzid Shoes account.
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
                value={user?.email || ""}
                disabled
                autoComplete="email"
              />
            </label>
  
            <label>
              <span>
                Phone
              </span>
  
              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value,
                  )
                }
                autoComplete="tel"
                inputMode="tel"
              />
            </label>
  
            {error && (
              <p className="account-form__error">
                {error}
              </p>
            )}
  
            {success && (
              <p className="account-form__success">
                {success}
              </p>
            )}
  
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
  
            <p>
              <Link to="/account">
                ← Back to Account
              </Link>
            </p>
          </form>
        </div>
      </main>
    );
  }
  
  export default ProfilePage;