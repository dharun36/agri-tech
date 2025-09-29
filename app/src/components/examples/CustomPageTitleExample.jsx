import React from 'react';
import { useTranslation } from 'react-i18next';
import PageTitle from '../ui/PageTitle';

/**
 * Example component showing how to use PageTitle directly in a component
 * instead of relying on AppLayout's automatic page title
 */
const CustomPageTitleExample = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      {/* Custom page title with explicit page name */}
      <PageTitle pageName="cropRecommendation" className="text-2xl mb-4" />

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">{t('custom_page_example')}</h2>
        <p className="text-gray-700">
          {t('this_page_demonstrates_custom_title')}
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-700 mb-2">
          {t('developer_note')}
        </h3>
        <p className="text-green-600 text-sm">
          {t('page_title_usage_note', {
            defaultValue: 'This component demonstrates how to use the PageTitle component directly in a page component when you need more control over the title placement or styling.'
          })}
        </p>
      </div>
    </div>
  );
};

export default CustomPageTitleExample;