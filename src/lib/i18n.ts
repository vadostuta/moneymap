// src/lib/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ua',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    defaultNS: 'common',
    ns: ['common'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  })

export default i18n
