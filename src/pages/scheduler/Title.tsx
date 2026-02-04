import React, { useState, useEffect } from 'react';
import { Flex, Tooltip } from 'antd';

import { IconTablerInfoCircle } from '@/shared/IconsNew';
import Input from '@/shared/Input';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';

const Title = () => {
  const { topic, mode, canModify, source, syncToGoogle } = useDetailDataValue();
  const setData = useSetDetailData();
  const { i18n } = useI18n();
  const isCreateMode = mode === 'create';
  const canNotEdit = !isCreateMode && !canModify;
  const showGoogleSync = isCreateMode ? syncToGoogle : source === 'google';

  // 使用本地 state 管理输入值，避免 async atom 更新导致的中文输入问题
  const [_topic, setTopic] = useState(topic || '');

  // 当外部 topic 变化时，同步到本地 state
  useEffect(() => {
    setTopic(_topic || '');
  }, [topic]);

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
            value={_topic}
            allowClear
            disabled={canNotEdit}
            onChange={e => {
              const meetingName = e.target.value?.slice(0, 80);
              setTopic(meetingName);
              setData({ topic: meetingName });
            }}
          />
        )}
      </div>
    </>
  );
};

export default Title;
