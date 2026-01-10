import React, { useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Input, Button, Popover } from 'antd';
import { IconCloseF, IconTablerPlus } from '@shared/IconsNew';

type Props = {
  files: any[];
  i18n: any;
  setFile: (file: any) => void;
  preview?: boolean;
  disabled?: boolean;
};

const ScheduleMeetingFileManager = (props: Props) => {
  const { files, setFile, preview = false, disabled = false } = props;
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [link, setLink] = useState('');

  if (disabled && !files.length) {
    return null;
  }

  const onConfirm = () => {
    let _link = link.trim();
    try {
      const url = new URL(_link);
      if (!['https', 'http'].includes(url.protocol)) {
        url.protocol = 'https';
        _link = url.toString();
      }
    } catch (error) {
      _link = `https://${_link}`;
    }

    unstable_batchedUpdates(() => {
      setFile((files: any[]) => [...files, { name: fileName, link: _link }]);
      setOpen(false);
      setLink('');
      setFileName('');
    });
  };

  const deleteFile = (index: number) => {
    setFile((files: any[]) => {
      return files.filter((_, i) => i !== index);
    });
  };

  const renderFiles = () => {
    if (files.length === 0) {
      return null;
    }

    return files.map((f: any, i: number) => {
      return (
        <div
          className="schedule-meeting-file-item"
          key={i}
          onClick={() => {
            window.open(f.link, '_blank');
          }}
        >
          <span>🔗</span>
          <span style={{ marginLeft: '4px' }}>{f.name}</span>
          {preview || disabled ? null : (
            <IconCloseF
              className="close"
              onClick={e => {
                e.stopPropagation?.();
                deleteFile(i);
              }}
            />
          )}
        </div>
      );
    });
  };

  const renderAddIcon = () => {
    if (preview || files.length >= 5 || disabled) {
      return null;
    }

    const content = () => {
      return (
        <>
          <Input
            style={{
              background: 'var(--dsw-color-bg-popup)',
            }}
            key="name"
            placeholder="Enter file name"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
          />
          <Input
            key="link"
            placeholder="Paste link"
            value={link}
            style={{
              marginTop: '16px',
              background: 'var(--dsw-color-bg-popup)',
            }}
            onChange={e => setLink(e.target.value)}
          />
          <div style={{ textAlign: 'right' }}>
            <Button
              size="small"
              key="ok"
              disabled={!fileName || !link}
              type="primary"
              onClick={onConfirm}
              style={{ marginTop: '9px' }}
            >
              Save
            </Button>
          </div>
        </>
      );
    };

    return (
      <Popover
        className="add-icon-wrapper"
        trigger="click"
        arrow={false}
        content={content}
        style={{ cursor: 'pointer' }}
        onOpenChange={setOpen}
        placement="topLeft"
        open={open}
        overlayStyle={{
          width: '250px',
        }}
        overlayInnerStyle={{ backgroundColor: `var(--dsw-color-bg-popup)` }}
      >
        <IconTablerPlus
          style={{
            width: '16px',
            height: '16px',
          }}
        />
        <span>Add</span>
      </Popover>
    );
  };

  return (
    <div className="item">
      <div className="item-title">File</div>
      <div>
        {renderAddIcon()}
        {renderFiles()}
      </div>
    </div>
  );
};

export default ScheduleMeetingFileManager;
