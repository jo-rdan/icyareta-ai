import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./translations/fr.json";
import en from "./translations/en.json";

i18n.use(initReactI18next).init({
  resources: {
    fr,
    en,
  },
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
