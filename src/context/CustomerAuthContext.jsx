import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentCustomer,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomerProfile,
} from "../services/customerAuthServices";

export function CustomerAuthProvider({ children }) {
  const updateProfile = useCallback(async ({ name }) => {
    setError(null);
  
    try {
      const updatedUser = await updateCustomerProfile({
        name,
      });
  
      setUser(updatedUser);
  
      return updatedUser;
    } catch (error) {
      setError(error?.message || "Unable to update your profile.");
  
      throw error;
    }
  }, []);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const CustomerAuthContext = createContext(null);

  const refreshCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = await getCurrentCustomer();

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      console.error("Customer authentication initialization failed:", error);

      setUser(null);

      setError(error?.message || "Unable to initialize your account.");

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  const signUp = useCallback(async ({ email, password, name }) => {
    setError(null);

    try {
      const newUser = await registerCustomer({
        email,
        password,
        name,
      });

      setUser(newUser);

      return newUser;
    } catch (error) {
      setError(error?.message || "Unable to create your account.");

      throw error;
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);

    try {
      const currentUser = await loginCustomer(email, password);

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      setUser(null);

      setError(error?.message || "Unable to sign in.");

      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);

    try {
      await logoutCustomer();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,

      isAuthenticated: Boolean(user),

      refreshCustomer,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }),
    [
      user,
      loading,
      error,
      refreshCustomer,
      signUp,
      signIn,
      signOut,
      updateProfile,
    ],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}




export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);

  if (!context) {
    throw new Error(
      "useCustomerAuth must be used inside CustomerAuthProvider.",
    );
  }

  return context;
}


