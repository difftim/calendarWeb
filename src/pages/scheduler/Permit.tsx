import React from 'react';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { cid2uid, stopClick } from '@/util';
import { userIdAtom } from '@/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { Checkbox, CheckboxChangeEvent, Flex, InputNumber, Space, Tooltip } from 'antd';
import { DetailData } from '@/atoms/detail';
import { useI18n } from '@/hooks/useI18n';
import { IconHelperF } from '@/shared/IconsNew';
import { queryScheduleConfigAtom } from '@/atoms/query';

type setOptionKey = keyof Pick<
  DetailData,
  | 'everyoneCanModify'
  | 'everyoneCanInviteOthers'
  | 'syncToGoogle'
  | 'speechTimerEnabled'
  | 'speechTimerDuration'
>;

function Permit() {
  const { i18n } = useI18n();
  const myId = useAtomValue(userIdAtom);
  const {
    mode,
    showMore,
    host,
    calendarId = myId,
    everyoneCanModify,
    isLiveStream,
    syncToGoogle,
    category,
    everyoneCanInviteOthers = true,
    speechTimerEnabled = false,
    speechTimerDuration = null as number | null,
  } = useDetailDataValue();
  const setData = useSetDetailData();
  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';
  const hostByOwner = isCreateMode || host === cid2uid(calendarId);
  const [showGoogleSyncOption] = useAtom(queryScheduleConfigAtom);

  if (isViewMode || (isCreateMode && !showMore)) {
    return null;
  }

  const setOptions = (key: setOptionKey) => (e: CheckboxChangeEvent) => {
    setData({ [key]: e.target.checked });
  };

  return (
    <div className="item">
      <div className="item-title" style={{ lineHeight: '22px' }}>
        Setting
      </div>
      <Space direction="vertical" style={{ width: '100%' }} size={0}>
        {hostByOwner && (
          <>
            <Flex align="start" style={{ height: '32px' }}>
              <Checkbox checked={everyoneCanModify} onChange={setOptions('everyoneCanModify')}>
                {i18n(
                  isLiveStream
                    ? 'schedule.liveModifyTip'
                    : category === 'event'
                      ? 'schedule.eventModifyTip'
                      : 'schedule.meetModifyTip'
                )}
                <Tooltip
                  mouseEnterDelay={0.2}
                  overlayClassName={'antd-tooltip-cover'}
                  placement="top"
                  title={i18n(
                    isLiveStream
                      ? 'schedule.liveModifyTipDetail'
                      : category === 'event'
                        ? 'schedule.eventModifyTipDetail'
                        : 'schedule.meetModifyTipDetail'
                  )}
                >
                  <IconHelperF className="helper-icon" onClick={stopClick} />
                </Tooltip>
              </Checkbox>
            </Flex>
            <Flex align="start" style={{ height: '32px' }}>
              <Checkbox
                disabled={everyoneCanModify}
                checked={everyoneCanInviteOthers}
                onChange={setOptions('everyoneCanInviteOthers')}
              >
                {isLiveStream ? `Attendee can invite others` : `Everyone can invite others `}
                <Tooltip
                  mouseEnterDelay={0.2}
                  overlayClassName={'antd-tooltip-cover'}
                  placement="top"
                  title={i18n(
                    isLiveStream
                      ? 'schedule.liveUncheckTip'
                      : category === 'event'
                        ? 'schedule.eventUncheckTip'
                        : 'schedule.meetUncheckTip'
                  )}
                >
                  <IconHelperF className="helper-icon" onClick={stopClick} />
                </Tooltip>
              </Checkbox>
            </Flex>
          </>
        )}
        {!isLiveStream && showGoogleSyncOption && isCreateMode && (
          <Flex align="start" style={{ height: '32px' }}>
            <Checkbox checked={syncToGoogle} onChange={setOptions('syncToGoogle')}>
              {i18n('schedule.syncToGoogle')}
            </Checkbox>
          </Flex>
        )}
        {category !== 'event' && (
          <Flex align="center" style={{ height: '32px', marginTop: '-4px' }}>
            <Checkbox
              disabled={!hostByOwner && !everyoneCanModify}
              checked={speechTimerEnabled}
              onChange={async e => {
                const checked = e.target.checked;
                let duration = speechTimerDuration || 120;
                setData({ speechTimerEnabled: checked, speechTimerDuration: duration });
              }}
            >
              <Flex align="center">
                <span>Enable timer{speechTimerEnabled ? ':' : ''}</span>
                {speechTimerEnabled && (
                  <>
                    <InputNumber
                      disabled={!hostByOwner && !everyoneCanModify}
                      size="small"
                      className="custom-time-input small"
                      min={1}
                      max={60}
                      placeholder="1-60"
                      style={{
                        margin: '0 6px',
                        width: '48px',
                        height: '28px',
                        borderRadius: '6px',
                      }}
                      onClick={stopClick}
                      value={(Number(speechTimerDuration) || 120) / 60}
                      onChange={value => {
                        if (value) {
                          setData({ speechTimerDuration: value * 60, speechTimerEnabled: true });
                        }
                      }}
                      precision={0}
                      step={1}
                    />
                    <span>mins</span>
                  </>
                )}
                <Tooltip
                  mouseEnterDelay={0.2}
                  overlayClassName={'antd-tooltip-cover'}
                  placement="top"
                  title={'Start timer automatically when attendees unmute'}
                >
                  <IconHelperF className="helper-icon" onClick={stopClick} />
                </Tooltip>
              </Flex>
            </Checkbox>
          </Flex>
        )}
      </Space>
    </div>
  );
}

export default Permit;
