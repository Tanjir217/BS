import {
    Link,
    useNavigate,
  } from "react-router-dom";
  
  import { useCustomerAuth } from "../../context/CustomerAuthContext";
  
  function AccountPage() {
    const navigate = useNavigate();
  
    const {
      user,
      loading,
      isAuthenticated,
      signOut,
    } = useCustomerAuth();
  
    async function handleLogout() {
      await signOut();
  
      navigate(
        "/",
        { replace: true },
      );
    }
  
    if (loading) {
      return (
        <main className="account-page">
          <div className="account-page__loading">
            Loading account...
          </div>
        </main>
      );
    }
  
    if (!isAuthenticated) {
      return (
        <main className="account-page">
          <div className="account-page__container">
            <div className="account-page__intro">
              <p>
                Bayzid Shoes
              </p>
  
              <h1>
                Your account.
              </h1>
  
              <span>
                Sign in to manage your account,
                orders and saved information.
              </span>
            </div>
  
            <div className="account-page__actions">
              <Link to="/account/login">
                Sign In
              </Link>
  
              <Link to="/account/register">
                Create Account
              </Link>
            </div>
          </div>
        </main>
      );
    }
  
    return (
      <main className="account-page">
        <div className="account-page__container">
          <div className="account-page__intro">
            <p>
              My Account
            </p>
  
            <h1>
              Hello,{" "}
              {user?.name || "there"}.
            </h1>
  
            <span>
              {user?.email}
            </span>
          </div>
  
          <div className="account-page__grid">
            <Link to="/account/orders">
              <strong>
                Orders
              </strong>
  
              <span>
                View your order history.
              </span>
            </Link>
  
            <Link to="/account/addresses">
              <strong>
                Addresses
              </strong>
  
              <span>
                Manage your delivery addresses.
              </span>
            </Link>
  
            <Link to="/account/profile">
              <strong>
                Profile
              </strong>
  
              <span>
                Manage your account information.
              </span>
            </Link>          </div>
  
          <button
            type="button"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </main>
    );
  }
  
  export default AccountPage;