// Quick translation test
import { useTranslation } from 'react-i18next';

export function TestTranslation() {
  const { t, i18n } = useTranslation();

  console.log('Current language:', i18n.language);
  console.log('Translation test:', t('tasks.today_tasks'));
  console.log('All tasks keys:', Object.keys(t('tasks', { returnObjects: true })));

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '10px' }}>
      <h3>Translation Debug</h3>
      <p>Current Language: {i18n.language}</p>
      <p>tasks.today_tasks: {t('tasks.today_tasks')}</p>
      <p>tasks.daily_activities: {t('tasks.daily_activities')}</p>
      <p>tasks.done: {t('tasks.done')}</p>
      <p>tasks.skip: {t('tasks.skip')}</p>
      <button onClick={() => i18n.changeLanguage('ta')}>Switch to Tamil</button>
      <button onClick={() => i18n.changeLanguage('en')}>Switch to English</button>
    </div>
  );
}