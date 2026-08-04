import React from 'react';
import { ScrollText, Store } from 'lucide-react';
import LegalPage, { DetailRow } from './LegalPage';
import { Lang } from './i18n';
import { OFFER } from './offerStrings';
import { COMPANY } from './privacyStrings';

const detailBlocks = (lang: Lang): Record<string, DetailRow[]> => {
  const t = OFFER[lang];
  return {
    seller: [
      { label: t.labels.business, value: COMPANY.legalName, icon: Store },
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

const OfferPage: React.FC = () => (
  <LegalPage
    content={OFFER}
    effectiveDate={COMPANY.effectiveDate}
    titleIcon={ScrollText}
    detailBlocks={detailBlocks}
  />
);

export default OfferPage;
