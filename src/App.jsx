import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Portfolio from "./Portfolio";
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";
import { auth } from "./firebase";
import { applyAppearance, useAppearance } from "./useAppearance";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = window.location.pathname === "/admin";

  // Single source of truth for appearance — loaded from Firebase
  const { appearance, saveAppearance, loaded } = useAppearance();

  // Apply portfolio appearance to <html>
  useEffect(() => {
    if (!loaded || isAdmin) return;
    applyAppearance(document.documentElement, appearance, "portfolio");
  }, [appearance, loaded, isAdmin]);

  // Apply admin appearance to <html> when on admin route
  useEffect(() => {
    if (!loaded || !isAdmin) return;
    applyAppearance(document.documentElement, appearance, "admin");
  }, [appearance, loaded, isAdmin]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || !loaded)
    return (
      <div
        style={{
          background: "#0d0d0d",
          color: "#b8966e",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: 13,
          letterSpacing: "0.1em",
        }}
      >
        Loading...
      </div>
    );

  if (isAdmin) {
    if (user)
      return (
        <AdminDashboard
          user={user}
          appearance={appearance}
          saveAppearance={saveAppearance}
        />
      );
    return <AdminLogin />;
  }

  return <Portfolio />;
}
