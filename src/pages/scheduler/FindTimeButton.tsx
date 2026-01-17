import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import React from 'react';

const FindTimeButton = () => {
  const { mode, canModify } = useDetailDataValue();
  const setData = useSetDetailData();
  const isViewMode = mode === 'view';
  const canNotEdit = mode !== 'create' && !canModify;
  const { i18n } = useI18n();

  if (canNotEdit || isViewMode) {
    return null;
  }

  return (
    <div className="item">
      <div className="item-title" />
      <div
        className="text-button"
        onClick={() => {
          setData({ childModalType: 'findTime' });
        }}
      >
        {i18n('schedule.findATime')}
      </div>
    </div>
  );
};

export default FindTimeButton;
