import React, { useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Drawer } from 'antd';
import { useAtom, useSetAtom } from 'jotai';
import { useLoadableDetailData, useSetDetailData } from '@/hooks/useDetailData';
import { INITIAL_DETAIL_DATA, showPannelAtom } from '@/atoms/detail';
import { currentScheduleDetailInfoAtom } from '@/atoms';
import Header, { LoadingHeader } from './Header';
import FindTime from './FindTime';
import { ConfigProvider } from '@/shared';
import { IconCloseF } from '@/shared/IconsNew';
import classNames from 'classnames';

const useShowFindTime = (loadableDetailData: ReturnType<typeof useLoadableDetailData>) => {
  if (loadableDetailData.state !== 'hasData') return false;
  const data = loadableDetailData.data;
  if (data.loading) return false;
  const { mode, canModify } = data;
  if (mode === 'create') return true;
  if (mode === 'update' && canModify) return true;
  return false;
};

export const ScheduleProvider: React.FC = ({ children }) => {
  const [show, setShow] = useAtom(showPannelAtom);
  const setDetailInfo = useSetAtom(currentScheduleDetailInfoAtom);
  const loadableDetailData = useLoadableDetailData();
  const setData = useSetDetailData();
  const isError = loadableDetailData.state === 'hasError';
  const loading = loadableDetailData.state === 'loading';
  const hasData = loadableDetailData.state === 'hasData';
  const isLoaded = hasData && !loadableDetailData.data.loading;
  const showFindTime = useShowFindTime(loadableDetailData);

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
        className={classNames('meeting-schedule-dialog', {
          loading,
          'with-find-time': showFindTime,
        })}
        closeIcon={false}
        title={showFindTime ? null : hasData ? <Header /> : <LoadingHeader />}
        open={show}
        loading={loading}
        width={showFindTime ? '100vw' : 360}
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
        {isLoaded ? (
          <div className="schedule-body-wrapper">
            <div className="meeting-main">
              {showFindTime && (
                <div className="meeting-main-close">
                  <IconCloseF
                    width={24}
                    height={24}
                    onClick={() => {
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
                  />
                </div>
              )}
              {children}
            </div>
            {showFindTime && <FindTime />}
          </div>
        ) : null}
      </Drawer>
    </ConfigProvider>
  );
};
