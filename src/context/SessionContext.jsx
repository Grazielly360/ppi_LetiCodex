import { createContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export const SessionContext = createContext({
  session: null,
  sessionLoading: false,
  sessionMessage: null,
  sessionError: null,
  handleSignUp: () => {},
  handleSignIn: () => {},
  handleSignOut: () => {},
});

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  useEffect(() => {
    // Initialize current session
    let mounted = true;
    async function init() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (mounted) setSession(currentSession);
      } catch (err) {
        console.error("Session init error:", err);
        setSessionError(err.message || String(err));
      }
    }
    init();

    // Listen to auth state changes
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    const subscription = data?.subscription;

    return () => {
      mounted = false;
      try {
        if (subscription && typeof subscription.unsubscribe === "function") {
          subscription.unsubscribe();
        }
      } catch (err) {
        console.warn("Failed to unsubscribe auth listener:", err);
      }
    };
  }, []);

  async function handleSignUp(email, password, username) {
    setSessionLoading(true);
    setSessionMessage(null);
    setSessionError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            admin: false,
          },
          emailRedirectTo: `${window.location.origin}/signin`,
        },
      });

      if (error) throw error;

      if (data.user) {
        setSessionMessage(
          "Registration successful! Check your email to confirm your account."
        );
        window.location.href = "/signin";
      }
    } catch (error) {
      setSessionError(error.message || String(error));
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleSignIn(email, password) {
    setSessionLoading(true);
    setSessionMessage(null);
    setSessionError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setSessionMessage("Sign in successful!");
      }
    } catch (error) {
      console.error("SignIn error:", error);
      setSessionError(error.message || String(error));
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleSignOut() {
    setSessionLoading(true);
    setSessionMessage(null);
    setSessionError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      window.location.href = "/";
    } catch (error) {
      setSessionError(error.message || String(error));
    } finally {
      setSessionLoading(false);
    }
  }

  const value = {
    session,
    sessionLoading,
    sessionMessage,
    sessionError,
    handleSignUp,
    handleSignIn,
    handleSignOut,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
