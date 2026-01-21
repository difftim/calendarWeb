import React, { useState } from 'react';
import { Flex, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';

import { Button } from '@/shared/Button';
import { IconTablerLink } from '@/shared/IconsNew';
import { toastError, toastSuccess } from '@/shared/Message';
import { uploadIcsData } from '@/api';

export interface IcsUploaderProps {
  onSuccess: () => void;
}

const IcsUploader = ({ onSuccess }: IcsUploaderProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  const readIcsFile = async (file: File) => {
    const ICS_PREFIX = 'data:text/calendar;base64,';
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result as string;
        if (!data.trim().startsWith(ICS_PREFIX)) {
          reject(data);
          return;
        }
        resolve(data.trim().slice(ICS_PREFIX.length));
      };
      reader.onerror = reject;
      reader.onabort = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    try {
      if (!fileList.length || loading) {
        return;
      }
      setLoading(true);
      const ics = await readIcsFile(fileList[0] as File);
      await uploadIcsData({ ics });
      setFileList([]);
      toastSuccess('import ics success!');
      onSuccess();
    } catch (error: any) {
      toastError(error?.message || 'Import ics file failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex vertical align="center" justify="center" gap={20} className="calendar-setting-uploader">
      <Upload.Dragger
        name="calendarIcs"
        accept=".ics"
        maxCount={1}
        fileList={fileList}
        beforeUpload={file => {
          setFileList([file]);
          return false;
        }}
        itemRender={(_, file, __, { remove }) => (
          <Flex align="center" justify="space-between" className="calendar-setting-file-item">
            <Flex align="center" gap={4}>
              <IconTablerLink width={16} height={16} />
              <span>{file.name}</span>
            </Flex>
            <span
              className="calendar-setting-file-remove"
              onClick={e => {
                e.stopPropagation();
                remove();
              }}
            >
              Remove
            </span>
          </Flex>
        )}
        onRemove={() => setFileList([])}
      >
        <div className="calendar-setting-uploader__title">Click or drag file to this area</div>
        <div className="calendar-setting-uploader__desc">Support for a single .ics file</div>
      </Upload.Dragger>
      <Button
        loading={loading}
        type="primary"
        disabled={fileList.length < 1}
        onClick={handleUpload}
      >
        Import
      </Button>
    </Flex>
  );
};

export default IcsUploader;

