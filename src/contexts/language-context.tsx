"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation("common");
  const [currentLanguage, setCurrentLanguage] = useState("en");

  // Set language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    console.log("savedLanguage", savedLanguage);
    const languageToUse = savedLanguage || i18n.language;

    if (languageToUse !== i18n.language) {
      i18n.changeLanguage(languageToUse);
    }
    setCurrentLanguage(languageToUse);
  }, [i18n]);

  // Update state when language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => setCurrentLanguage(lng);
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
    setCurrentLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
