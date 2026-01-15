import React from 'react';
import { Input } from 'antd';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import Linkify from 'linkify-react';
import { registerCustomProtocol } from 'linkifyjs';

registerCustomProtocol('difft');
registerCustomProtocol('wea');
registerCustomProtocol('cctm');
registerCustomProtocol('weatest');
registerCustomProtocol('ccm');
registerCustomProtocol('chative');

const Desc = () => {
  const { mode, description = '', showMore, canModify } = useDetailDataValue();
  const canNotEdit = mode !== 'create' && !canModify;
  const setData = useSetDetailData();

  if (mode === 'view') {
    if (!description) {
      return null;
    }

    return (
      <div className="item">
        <div className="item-title">Desc.</div>
        <div
          className="preview-item"
          style={{
            wordBreak: 'break-word',
            marginBottom: '20px',
            minHeight: '40px',
            height: 'auto',
            whiteSpace: 'break-spaces',
          }}
        >
          <Linkify options={{ attributes: { target: '_blank' } }}>{description}</Linkify>
        </div>
      </div>
    );
  }

  if (mode === 'create' && !showMore) {
    return null;
  }

  if (mode !== 'create' && canNotEdit && !description) {
    return null;
  }

  return (
    <div className="item">
      <div className="item-title">Desc.</div>
      <div>
        <Input.TextArea
          disabled={canNotEdit}
          placeholder="Write some notes"
          maxLength={2000}
          value={description}
          autoSize={{ minRows: 4 }}
          onChange={e => setData({ description: e.target.value })}
        />
      </div>
    </div>
  );
};

export default Desc;
