import { IconTablerInfoCircle } from '@/components/shared/IconsNew';
import Input from '@/components/shared/Input';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import { Flex, Tooltip } from 'antd';
import React from 'react';

const Title = () => {
  const { topic, mode, canModify, source, syncToGoogle } = useDetailDataValue();
  const setData = useSetDetailData();
  const { i18n } = useI18n();
  const isCreateMode = mode === 'create';
  const canNotEdit = !isCreateMode && !canModify;
  const showGoogleSync = isCreateMode ? syncToGoogle : source === 'google';

  return (
    <>
      {showGoogleSync && (
        <Flex
          align="center"
          gap={4}
          justify="center"
          className="google-tooltip"
          onClick={e => {
            e.stopPropagation();
            setTimeout(() => {
              const container = document.querySelector(
                '.meeting-schedule-dialog > .ant-drawer-body'
              );
              container?.scrollTo({
                top: 600,
                behavior: 'smooth',
              });
            }, 50);
          }}
        >
          <Tooltip
            mouseEnterDelay={0.5}
            overlayClassName={'antd-tooltip-cover antd-tooltip-cover-left virtual-room-tooltip'}
            placement="bottom"
            title={i18n('schedule.syncToGoogleContent')}
          >
            <IconTablerInfoCircle />
          </Tooltip>
          <div>{i18n('schedule.syncToGoogle')}</div>
        </Flex>
      )}
      <div className="item">
        <div className="item-title">{i18n('schedule.topic')}</div>
        {mode === 'view' ? (
          <div className="preview-item" style={{ height: 'auto' }}>
            {topic}
          </div>
        ) : (
          <Input
            max={2000}
            size="large"
            placeholder={i18n('schedule.addTopic')}
            value={topic}
            allowClear
            disabled={canNotEdit}
            onChange={e => {
              const meetingName = e.target.value?.slice(0, 80);
              setData({ topic: meetingName });
            }}
          />
        )}
      </div>
    </>
  );
};

export default Title;
