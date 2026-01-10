import React from 'react';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';

function More() {
  const { mode, showMore } = useDetailDataValue();
  const setData = useSetDetailData();
  if (mode !== 'create' || showMore) {
    return null;
  }

  return (
    <div
      onClick={() => setData({ showMore: true })}
      style={{
        marginTop: '16px',
        color: 'var(--dsw-color-bg-primary)',
        cursor: 'pointer',
      }}
    >
      More
    </div>
  );
}

export default More;
