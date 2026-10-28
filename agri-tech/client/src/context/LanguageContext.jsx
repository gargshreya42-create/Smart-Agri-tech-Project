import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import translations, { LANGUAGE_OPTIONS } from '../translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'agri_lang';

const readStored = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return translations[stored] ? stored : 'en';
  } catch {
    return 'en';
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStored);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const setLanguage = useCallback((code) => {
    if (!translations[code]) return;
    setLanguageState(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* storage unavailable */ }
  }, []);

  // t('dashboard.title') — falls back to English, then to the key itself. {vars} are interpolated.
  const t = useCallback(
    (key, vars) => {
      let text = translations[language][key] ?? translations.en[key] ?? key;
      if (vars) Object.entries(vars).forEach(([name, value]) => { text = text.replaceAll(`{${name}}`, value); });
      return text;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t, languages: LANGUAGE_OPTIONS }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
