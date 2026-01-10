import React, { useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Drawer } from 'antd';
import { useAtom, useSetAtom } from 'jotai';
import { useLoadableDetailData, useSetDetailData } from '@/hooks/useDetailData';
import { INITIAL_DETAIL_DATA, showPannelAtom } from '@/atoms/detail';
import { currentScheduleDetailInfoAtom } from '@/atoms';
import Header from './Header';
import { ConfigProvider } from '@/components/shared';

export const ScheduleProvider: React.FC = ({ children }) => {
  const [show, setShow] = useAtom(showPannelAtom);
  const setDetailInfo = useSetAtom(currentScheduleDetailInfoAtom);
  const loadableDetailData = useLoadableDetailData();
  const setData = useSetDetailData();
  // const resetData = useResetDetailData();
  const isError = loadableDetailData.state === 'hasError';
  const isLoading = loadableDetailData.state === 'loading';
  const hasData = loadableDetailData.state === 'hasData';
  const isLoaded = hasData && !loadableDetailData.data.loading;

  console.log('🔵 SchedulerMeetingProvider', loadableDetailData);

  useEffect(() => {
    if (isError) {
      setShow(false);
    }
  }, [isError]);

  useEffect(() => {
    if (!show) {
      setData(INITIAL_DETAIL_DATA);
    }
  }, [show, setData]);

  return (
    <ConfigProvider isLightlyDisableMode>
      <Drawer
        className="meeting-schedule-dialog"
        closeIcon={false}
        title={hasData && <Header />}
        open={show}
        loading={isLoading}
        width={360}
        push={false}
        onClose={() => {
          unstable_batchedUpdates(() => {
            setShow(false);
            setDetailInfo(info => ({
              ...info,
              currentCid: 'default',
              currentEid: '',
              currentSource: '',
              currentFreeTimeId: '',
            }));
          });
        }}
      >
        {isLoaded ? <div className="meeting-main">{children}</div> : null}
      </Drawer>
    </ConfigProvider>
  );
};
