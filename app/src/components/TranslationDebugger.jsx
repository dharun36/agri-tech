import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { forceLanguageChange, testTranslation, testCropTranslations } from '../utils/languageDebug';
import { inspectTranslations, fixCommonTranslationIssues, reinitializeI18n } from '../utils/translationInspector';

/**
 * Translation Debugger Component
 * Helps identify and fix translation issues in the application
 */
const TranslationDebugger = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [testKey, setTestKey] = useState('database_content.crops.crop_rice');
  const [results, setResults] = useState({});
  const [loadedNamespaces, setLoadedNamespaces] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLoadedNamespaces(i18n.reportNamespaces.getUsedNamespaces());
    }
  }, [isOpen, i18n]);

  const toggleDebugger = () => setIsOpen(!isOpen);

  const changeLanguage = (lang) => {
    forceLanguageChange(lang);
    setLoadedNamespaces(i18n.reportNamespaces.getUsedNamespaces());
  };

  const runTest = () => {
    const result = testTranslation(testKey);
    setResults(result);
  };

  const runCropTest = () => {
    const result = testCropTranslations();
    console.log("Crop translation test results:", result);
  };

  // Check i18n initialization status
  const checkI18nStatus = () => {
    console.log("i18n status:", {
      initialized: i18n.isInitialized,
      language: i18n.language,
      languages: i18n.languages,
      dir: i18n.dir(),
      format: i18n.format,
      options: i18n.options,
      resourceStore: i18n.store ? i18n.store.data : 'Not available'
    });

    // Try to get and log resource bundles
    if (i18n.store && i18n.store.data) {
      const langs = Object.keys(i18n.store.data);
      langs.forEach(lang => {
        const namespaces = Object.keys(i18n.store.data[lang] || {});
        console.log(`Resources for ${lang}:`, namespaces);

        namespaces.forEach(ns => {
          console.log(`${lang}/${ns} sample keys:`,
            Object.keys(i18n.store.data[lang][ns] || {}).slice(0, 5));
        });
      });
    }

    return "Check console for detailed i18n status";
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleDebugger}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '5px 10px',
          background: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Debug Translations
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '350px',
      maxHeight: '80vh',
      overflowY: 'auto',
      background: '#f8f9fa',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      zIndex: 9999,
      boxShadow: '0 0 10px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Translation Debugger</h3>
        <button
          onClick={toggleDebugger}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>Current Language: {i18n.language}</h4>
        <div>
          <button onClick={() => changeLanguage('en')} style={{ marginRight: '5px' }}>English</button>
          <button onClick={() => changeLanguage('ta')} style={{ marginRight: '5px' }}>Tamil</button>
          <button onClick={() => changeLanguage('hi')}>Hindi</button>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>Test Translation Key</h4>
        <input
          type="text"
          value={testKey}
          onChange={e => setTestKey(e.target.value)}
          style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
        />
        <button onClick={runTest}>Test Key</button>
        <button onClick={runCropTest} style={{ marginLeft: '5px' }}>Test Crops</button>
      </div>

      {Object.keys(results).length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Results:</h4>
          {Object.entries(results).map(([lang, value]) => (
            <div key={lang} style={{ margin: '5px 0' }}>
              <strong>{lang}:</strong> {value}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4>Loaded Namespaces</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {loadedNamespaces.map(ns => (
            <li key={ns}>{ns}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Quick Translations</h4>
        <div style={{ fontSize: '14px', marginBottom: '5px' }}>
          <strong>Rice:</strong> {t('database_content.crops.crop_rice')}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '5px' }}>
          <strong>Vegetables:</strong> {t('database_content.categories.category_vegetables')}
        </div>
        <div style={{ fontSize: '14px' }}>
          <strong>Watering task:</strong> {t('database_content.tasks.task_watering')}
        </div>
      </div>

      <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={checkI18nStatus}>Check i18n Status</button>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={() => {
            const analysis = inspectTranslations();
            console.log('Translation Analysis:', analysis);
            alert('Translation analysis logged to console');
          }}>
            Inspect Translations
          </button>

          <button onClick={() => {
            const results = fixCommonTranslationIssues();
            console.log('Fix results:', results);
            alert(`Fixed ${results.fixed.length} issues. ${results.failed.length} issues couldn't be fixed.`);
          }}>
            Auto-Fix Issues
          </button>

          <button onClick={() => {
            reinitializeI18n();
            alert('i18n resources reloaded');
          }}>
            Reload i18n
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationDebugger;