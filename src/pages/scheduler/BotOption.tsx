import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { Checkbox, Flex, Tooltip } from 'antd';

import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import { IconHelperF } from '@/shared/IconsNew';
import { hasMatchedBot, stopClick } from '@/util';
import { queryScheduleConfigAtom } from '@/atoms/query';

const PREVIEW_ITEM_STYLE = { minHeight: '40px' };

function BotOption() {
  const { i18n } = useI18n();
  const {
    mode,
    members,
    category,
    botAutoJoinEnabled = true,
    botIncluded,
    canInvite,
  } = useDetailDataValue();
  const setData = useSetDetailData();
  const [precreateConfigResult] = useAtom(queryScheduleConfigAtom);
  const availableBots = precreateConfigResult?.data?.availableBots ?? [];

  const touchedRef = useRef(false);
  const prevHasBotRef = useRef(false);

  const isEvent = category === 'event';
  const isViewMode = mode === 'view';
  const isCreateOrUpdate = mode === 'create' || mode === 'update';

  const hasBotNow = !isEvent && hasMatchedBot(members, availableBots);

  useEffect(() => {
    const prevHasBot = prevHasBotRef.current;
    prevHasBotRef.current = hasBotNow;

    if (!isCreateOrUpdate) return;

    // bot removed completely → reset touched
    if (prevHasBot && !hasBotNow) {
      touchedRef.current = false;
    }

    // bot added and user hasn't manually toggled → auto-enable
    if (!prevHasBot && hasBotNow && !touchedRef.current) {
      setData({ botAutoJoinEnabled: true });
    }
  }, [hasBotNow, isCreateOrUpdate, setData]);

  if (isEvent) return null;

  const showBotOption = isViewMode ? Boolean(botIncluded) : hasBotNow;

  if (!showBotOption) return null;

  if (isViewMode) {
    return (
      <div className="item">
        <div className="item-title">{i18n('schedule.bot')}</div>
        <Flex
          align="center"
          gap={4}
          style={{ ...PREVIEW_ITEM_STYLE, height: 'auto' }}
        >
          <span>
            {i18n(
              botAutoJoinEnabled
                ? 'schedule.autoJoinEnabled'
                : 'schedule.autoJoinDisabled'
            )}
          </span>
          <Tooltip
            mouseEnterDelay={0.2}
            overlayClassName={'antd-tooltip-cover bot-autojoin-tip'}
            placement="top"
            title={i18n('schedule.autoJoinTip')}
          >
            <IconHelperF className="helper-icon" onClick={stopClick} />
          </Tooltip>
        </Flex>
      </div>
    );
  }

  if (!isCreateOrUpdate) return null;

  return (
    <div className="item">
      <div className="item-title">{i18n('schedule.bot')}</div>
      <div style={{ maxWidth: '248px' }}>
        <Flex align="center" style={{ minHeight: '40px' }}>
          <Checkbox
            checked={botAutoJoinEnabled}
            disabled={isViewMode && canInvite === false}
            onChange={e => {
              touchedRef.current = true;
              setData({ botAutoJoinEnabled: e.target.checked });
            }}
          >
            <span>{i18n('schedule.autoJoin')}</span>
            <Tooltip
              mouseEnterDelay={0.2}
              overlayClassName={'antd-tooltip-cover bot-autojoin-tip'}
              placement="top"
              title={i18n('schedule.autoJoinTip')}
            >
              <IconHelperF className="helper-icon" onClick={stopClick} />
            </Tooltip>
          </Checkbox>
        </Flex>
      </div>
    </div>
  );
}

export default BotOption;
