import React from 'react';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import ScheduleMeetingFileManager from './components/ScheduleMeetingFileManager';
import { useI18n } from '@/hooks/useI18n';

function FileManager() {
  const { mode, attachment: _attachment, canModify, showMore } = useDetailDataValue();
  const attachment = _attachment || [];
  const { i18n } = useI18n();
  const canNotEdit = mode !== 'create' && !canModify;
  const setData = useSetDetailData();
  const setFile = (attachment: any) => {
    setData({ attachment });
  };

  if (mode !== 'create') {
    // 预览模式
    if (mode === 'view') {
      if (!attachment?.length) {
        return null;
      }
      return (
        <ScheduleMeetingFileManager files={attachment} setFile={setFile} i18n={i18n} preview />
      );
    }

    // 编辑模式
    return (
      <ScheduleMeetingFileManager
        i18n={i18n}
        disabled={canNotEdit}
        files={attachment}
        setFile={setFile}
      />
    );
  }

  if (!showMore) return null;

  return <ScheduleMeetingFileManager i18n={i18n} files={attachment} setFile={setFile} />;
}

export default FileManager;
