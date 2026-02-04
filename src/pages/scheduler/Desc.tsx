import React, { useState, useEffect } from 'react';
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

  // 使用本地 state 管理输入值，避免 async atom 更新导致的中文输入问题
  const [desc, setDesc] = useState(description);

  // 当外部 description 变化时，同步到本地 state
  useEffect(() => {
    setDesc(description);
  }, [description]);

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
          value={desc}
          autoSize={{ minRows: 4 }}
          onChange={e => {
            setDesc(e.target.value);
            setData({ description: e.target.value });
          }}
        />
      </div>
    </div>
  );
};

export default Desc;
