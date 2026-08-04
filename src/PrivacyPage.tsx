import React from 'react';
import { ShieldCheck, Building2 } from 'lucide-react';
import LegalPage, { DetailRow } from './LegalPage';
import { Lang } from './i18n';
import { PRIVACY, COMPANY } from './privacyStrings';

const detailBlocks = (lang: Lang): Record<string, DetailRow[]> => {
  const t = PRIVACY[lang];
  return {
    who: [
      { label: t.labels.business, value: COMPANY.legalName, icon: Building2 },
      { label: t.labels.registration, value: COMPANY.registration },
      { label: t.labels.address, value: COMPANY.address },
    ],
    contact: [
      { label: t.labels.business, value: COMPANY.legalName },
      { label: t.labels.email, value: COMPANY.email, kind: 'email' },
      { label: t.labels.phone, value: COMPANY.phone, kind: 'phone' },
    ],
  };
};

const PrivacyPage: React.FC = () => (
  <LegalPage
    content={PRIVACY}
    effectiveDate={COMPANY.effectiveDate}
    titleIcon={ShieldCheck}
    detailBlocks={detailBlocks}
  />
);

export default PrivacyPage;
