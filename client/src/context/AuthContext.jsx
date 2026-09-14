import { createContext, useContext, useState, useEffect } from "react";

// 1. Add "export" here so named imports like { AuthContext } work
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On initial app load, check if a session exists in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("cospay_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error reading saved user session:", error);
        localStorage.removeItem("cospay_user");
      }
    }
    setLoading(false);
  }, []);

  // Save session upon successful login or registration
  const login = (userData) => {
    localStorage.setItem("cospay_user", JSON.stringify(userData));
    setUser(userData);
  };

  // Clear session on logout
  const logout = () => {
    localStorage.removeItem("cospay_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook to access auth state anywhere
export const useAuth = () => useContext(AuthContext);

export default AuthContext;