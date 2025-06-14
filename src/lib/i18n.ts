// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resources from './locales/resources' // Your JSONs statically imported

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  lng: 'en',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
