import React from 'react'
import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    try { localStorage.setItem('i18nextLng', lng); } catch { }
    if (typeof document !== 'undefined') document.documentElement.lang = lng;
  }

  return (
    <div className="language-switcher">
      <button onClick={() => changeLang('en')} className="mr-2">EN</button>
      <button onClick={() => changeLang('ta')}>TA</button>
    </div>
  )
}

export default LanguageSwitcher
