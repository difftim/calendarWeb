import { IconChevronRight, IconHelperF } from '@/components/shared/IconsNew';
import Select from '@/components/shared/Select';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import { stopClick } from '@/util';
import { Flex, Tooltip } from 'antd';
import React from 'react';

const Guest = () => {
  const {
    isLiveStream,
    mode,
    guests = { allStaff: false, users: [], total: 0 },
  } = useDetailDataValue();
  const setData = useSetDetailData();
  const { i18n } = useI18n();

  if (!isLiveStream) {
    return null;
  }

  // view
  if (mode === 'view') {
    if (!guests || (!guests.allStaff && guests.users.length === 0)) {
      return null;
    }

    if (guests.allStaff) {
      return (
        <>
          <div className="item">
            <div
              className="item-title"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: '2px',
                height: '40px',
              }}
            >
              <span>Guest</span>
              <Tooltip
                mouseEnterDelay={0.2}
                overlayClassName={'antd-tooltip-cover'}
                placement="top"
                title={i18n('schedule.guestsTip')}
              >
                <IconHelperF className="helper-icon" onClick={stopClick} />
              </Tooltip>
            </div>
            <div className="preview-item">
              {i18n('schedule.allStaffNum', [guests.total > 0 ? ` (${guests.total})` : ''])}
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="item">
        <div
          className="item-title"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: '2px',
            height: '40px',
          }}
        >
          <span>{i18n('schedule.guest')}</span>
          <Tooltip
            mouseEnterDelay={0.2}
            overlayClassName={'antd-tooltip-cover'}
            placement="top"
            title={i18n('schedule.guestsTip')}
          >
            <IconHelperF className="helper-icon" onClick={stopClick} />
          </Tooltip>
        </div>
        <div>
          <Flex
            className="hover preview-item"
            align="center"
            justify="space-between"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setData({ childModalType: 'guest' });
            }}
          >
            <div>{guests.users.length}</div>
            <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
          </Flex>
        </div>
      </div>
    );
  }

  // TODO: fetch my org info
  const fetchMyOrgInfo = async () => {};

  const guestTipKey =
    mode === 'update' ? 'schedule.updateStaffTipWithTotal' : 'schedule.allStaffTipWithTotal';

  // edit
  return (
    <div className="item">
      <div
        className="item-title"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: '2px',
          height: '40px',
        }}
      >
        <span>Guest</span>
        <Tooltip
          mouseEnterDelay={0.2}
          overlayClassName={'antd-tooltip-cover'}
          placement="top"
          title={i18n('schedule.guestsTip')}
        >
          <IconHelperF className="helper-icon" onClick={stopClick} />
        </Tooltip>
      </div>
      <div style={{ maxWidth: '248px' }}>
        <Select
          onSelect={value => {
            if (value === 'allStaff') {
              setData(prev => {
                const guests = prev.guests ?? { users: [], total: 0 };
                return {
                  guests: {
                    ...guests,
                    allStaff: true,
                  },
                };
              });
              fetchMyOrgInfo();
            } else {
              setData(data => {
                const guests = data.guests ?? { users: [], total: 0 };
                return {
                  guests: {
                    ...guests,
                    allStaff: false,
                  },
                };
              });
              // TODO
              // addGuestFromDialog();
            }
          }}
          variant="outlined"
          size="large"
          value={guests.allStaff ? 'allStaff' : 'selectedGuest'}
          options={[
            {
              label: `All staff${guests.total > 0 ? ` (${guests.total})` : ''}`,
              value: 'allStaff',
            },
            {
              label: 'Select guests',
              value: 'selectedGuest',
            },
          ]}
          popupClassName="schedule-selector"
          virtual={false}
        />
        {!guests.allStaff && guests.users.length > 0 ? (
          <Flex
            className="hover"
            justify="space-between"
            align="center"
            style={{
              cursor: 'pointer',
              padding: '2px 4px',
              marginTop: '8px',
            }}
            onClick={() => {
              setData({ childModalType: 'guest' });
            }}
          >
            <span>{guests.users.length}</span>
            <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
          </Flex>
        ) : null}
        {guests.allStaff ? (
          <div
            className="dsw-shared-typography-p4"
            style={{
              color: 'var(--dsw-color-text-third)',
              marginTop: '10px',
            }}
          >
            {guests.total > 0
              ? i18n(guestTipKey, [`${guests.total}`])
              : i18n(`schedule.allStaffTip`)}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Guest;
