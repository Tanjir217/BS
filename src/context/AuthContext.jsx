import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    getCurrentUser,
    getManagementAccess,
    loginAdmin,
    logoutAdmin,
  } from "../services/authServices";
  import {
    hasAccess,
    hasAnyManagementRole,
    hasManagementRole,
  } from "../utils/managementRoles";
  const AuthContext = createContext(null);
  
  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [management, setManagement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
  
    const refreshAuth = useCallback(async () => {
        setLoading(true);
        setAuthError(null);
      
        try {
          const currentUser = await getCurrentUser();
      
          if (!currentUser) {
            setUser(null);
            setManagement(null);
            return null;
          }
      
          const managementAccess =
            await getManagementAccess(currentUser);
      
          if (!managementAccess.isMember) {
            await logoutAdmin().catch(() => {});
      
            setUser(null);
            setManagement(null);
      
            return null;
          }
      
          setUser(currentUser);
          setManagement(managementAccess);
      
          return {
            user: currentUser,
            management: managementAccess,
          };
        } catch (error) {
          console.error(
            "Auth initialization failed:",
            error
          );
      
          setUser(null);
          setManagement(null);
      
          setAuthError(
            error?.message ||
              "Unable to initialize authentication."
          );
      
          return null;
        } finally {
          setLoading(false);
        }
      }, []);
  
    useEffect(() => {
      refreshAuth();
    }, [refreshAuth]);
  
    const signIn = useCallback(
        async (email, password) => {
          setAuthError(null);
      
          try {
            await loginAdmin(email, password);
      
            const currentUser = await getCurrentUser();
      
            if (!currentUser) {
              throw new Error(
                "Unable to load the signed-in user."
              );
            }
      
            const managementAccess =
              await getManagementAccess(currentUser);
      
            if (!managementAccess.isMember) {
              throw new Error(
                "This account does not have access to the management area."
              );
            }
      
            setUser(currentUser);
            setManagement(managementAccess);
      
            return {
              user: currentUser,
              management: managementAccess,
            };
          } catch (error) {
            await logoutAdmin().catch(() => {});
      
            setUser(null);
            setManagement(null);
      
            throw error;
          }
        },
        []
      );
  
    const signOut = useCallback(async () => {
      try {
        await logoutAdmin();
      } finally {
        setUser(null);
        setManagement(null);
        setAuthError(null);
      }
    }, []);
    const hasRole = useCallback(
        (role) =>
          hasManagementRole(management?.roles, role),
        [management?.roles]
      );
      
      const hasAnyRole = useCallback(
        (roles) =>
          hasAnyManagementRole(
            management?.roles,
            roles
          ),
        [management?.roles]
      );
      
      const canAccess = useCallback(
        (area) =>
          hasAccess(
            management?.roles,
            area
          ),
        [management?.roles]
      );
      const value = useMemo(
        () => ({
          user,
          management,
          loading,
          authError,
          isAuthenticated: Boolean(user),
          isManagementMember: Boolean(
            management?.isMember
          ),
          managementRoles: management?.roles || [],
          hasRole,
          hasAnyRole,
          canAccess,
          refreshAuth,
          signIn,
          signOut,
        }),
        [
          user,
          management,
          loading,
          authError,
          hasRole,
          hasAnyRole,
          canAccess,
          refreshAuth,
          signIn,
          signOut,
        ]
      );
  
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth() {
    const context = useContext(AuthContext);
  
    if (!context) {
      throw new Error(
        "useAuth must be used inside AuthProvider."
      );
    }
  
    return context;
  }