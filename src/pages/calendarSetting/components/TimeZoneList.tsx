import React, { useEffect, useMemo, useState } from 'react';
import { AutoSizer, List as VList } from 'react-virtualized';
import { Flex, Spin } from 'antd';
import dayjs from 'dayjs';

import SearchInput from '@/shared/Input/SearchInput';
import { TablerSearch } from '@/shared/IconsNew';
import { useTimeZoneDayjs } from '@/hooks/useTimeZoneDayjs';

import { getTimeZone, TimeZoneInfo } from '../utils';

export interface TimeZoneListProps {
  onBack: () => void;
}

const TimeZoneList = ({ onBack }: TimeZoneListProps) => {
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [list, setList] = useState<TimeZoneInfo[]>([]);
  const { setTimeZone } = useTimeZoneDayjs();

  useEffect(() => {
    try {
      const supportedValuesOf = (Intl as any).supportedValuesOf as
        | undefined
        | ((key: string) => string[]);
      if (typeof supportedValuesOf === 'function') {
        const result = supportedValuesOf('timeZone').map(getTimeZone);
        setList(result);
      } else {
        setList([getTimeZone(dayjs.tz.guess())]);
      }
    } catch {
      setList([getTimeZone(dayjs.tz.guess())]);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderList = useMemo(() => {
    if (!searchText) {
      return list;
    }
    const searchWord = searchText.toLowerCase();
    return list.filter(item => {
      const tz = item.timeZone.toLowerCase();
      const offset = item.utcOffset.toLowerCase();
      return tz.includes(searchWord) || offset.includes(searchWord);
    });
  }, [searchText, list]);

  if (loading) {
    return (
      <Flex justify="center" style={{ marginTop: '50px' }}>
        <Spin />
      </Flex>
    );
  }

  return (
    <>
      <div className="calendar-setting-search">
        <SearchInput
          prefix={<TablerSearch className="module-common-header__searchinput-prefix" />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>
      {renderList.length > 0 ? (
        <AutoSizer>
          {({ height, width }) => (
            <VList
              width={width}
              height={height}
              rowHeight={36}
              rowCount={renderList.length}
              rowRenderer={({ index, style }) => {
                const item = renderList[index];
                return (
                  <div
                    style={style}
                    className="calendar-setting-timezone-item"
                    key={item.timeZone}
                    onClick={() => {
                      setTimeZone(item.timeZone);
                      onBack();
                    }}
                  >
                    <Flex align="center" gap="8px">
                      <div className="dsw-shared-typography-p3">{item.timeZone}</div>
                      <div className="timezone-utc">{item.utcOffset}</div>
                    </Flex>
                  </div>
                );
              }}
            />
          )}
        </AutoSizer>
      ) : (
        <div className="calendar-setting-empty">No results for {searchText}</div>
      )}
    </>
  );
};

export default TimeZoneList;
