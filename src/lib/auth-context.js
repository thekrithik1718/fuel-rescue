"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_PROFILES } from "./mock-store";
import { ROLES } from "./state-machine";

const AuthContext = createContext({
  user: null,
  role: ROLES.CUSTOMER,
  setRole: () => {},
  switchUser: () => {},
  logout: () => {},
});

const AUTH_USER_KEY = "fuel_rescue_auth_user_v1";

export function AuthProvider({ children }) {
  // Default to Customer Priya Sharma
  const [currentUser, setCurrentUser] = useState(INITIAL_PROFILES[3]); // Priya Sharma

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const switchUser = (profileId) => {
    const found = INITIAL_PROFILES.find((p) => p.id === profileId);
    if (found) {
      setCurrentUser(found);
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(found));
      } catch (e) {}
    }
  };

  const setRole = (newRole) => {
    // Switch to first profile with that role
    const profile = INITIAL_PROFILES.find((p) => p.role === newRole) || INITIAL_PROFILES[3];
    setCurrentUser(profile);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
    } catch (e) {}
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role: currentUser?.role || ROLES.CUSTOMER,
        setRole,
        switchUser,
        logout,
        availableProfiles: INITIAL_PROFILES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
