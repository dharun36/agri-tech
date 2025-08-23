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
      <button onClick={() => changeLang('en')} className="mr-2 text-white hover:bg-gray-800 p-1">EN</button>
      <button onClick={() => changeLang('ta')} className="text-white hover:bg-gray-800 p-1">TA</button>
    </div>
  )
}

export default LanguageSwitcher
