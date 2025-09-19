import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en/translation.json'
import taskEn from './locales/en/tasks.json'
import ta from './locales/ta/translation.json'
import hi from './locales/hi/translation.json'

import taskTa from './locales/ta/task-translations.json'
import taskHi from './locales/hi/tasks.json';

const resources = {
  en: {
    translation: en,
    tasks: taskEn
  },
  ta: {
    translation: ta,
    tasks: taskTa
  },
  hi: {
    translation: hi,
    tasks: taskHi
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })

export default i18n
