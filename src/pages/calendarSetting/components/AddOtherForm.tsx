import React, { useState } from 'react';

import { Button } from '@/shared/Button';
import Input from '@/shared/Input';
import { IconTablerInfoCircle } from '@/shared/IconsNew';
import { toastError, toastSuccess } from '@/shared/Message';
import { addUserCalendar } from '@/api';
import { uid2cid } from '@/util';

import { getRealId, isSearchMatchId } from '@/util';

export interface AddOtherFormProps {
  onSuccess: () => void;
}

const AddOtherForm = ({ onSuccess }: AddOtherFormProps) => {
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    try {
      const trimmed = uid.trim();
      if (!trimmed || loading) {
        return;
      }
      if (!isSearchMatchId(trimmed)) {
        toastError('uid format error');
        return;
      }
      setLoading(true);
      await addUserCalendar({
        cid: uid2cid(getRealId(trimmed)),
        type: 'otherCalendar',
        name: name || '',
      });
      toastSuccess('subscribe successfully!');
      onSuccess();
    } catch (error: any) {
      toastError(error?.message || 'add calendar fail, try again later!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calendar-setting-form">
      <div className="calendar-setting-form__label">
        <span className="required">*</span>Please enter the UID you want to subscribe:
      </div>
      <Input placeholder="e.g 71234567890" value={uid} onChange={e => setUid(e.target.value)} />
      <div className="calendar-setting-form__label">Name:</div>
      <Input
        placeholder="Enter a name"
        value={name}
        onChange={e => setName(e.target.value?.slice(0, 30) || '')}
      />
      <div className="calendar-setting-form__tip">
        <IconTablerInfoCircle />
        <span>
          After subscribing, you can conveniently and quickly check the calendar and availability
          status of this account.
        </span>
      </div>
      <div className="calendar-setting-form__footer">
        <Button size="large" disabled={!uid} type="primary" onClick={onConfirm} loading={loading}>
          Subscribe
        </Button>
      </div>
    </div>
  );
};

export default AddOtherForm;
