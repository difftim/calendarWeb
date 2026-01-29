import React, { useState } from 'react';
import { useAtomValue } from 'jotai';

import { Button } from '@/shared/Button';
import Input from '@/shared/Input';
import { toastError, toastSuccess } from '@/shared/Message';
import { addProxyPermission } from '@/api';
import { getRealId, isSearchMatchId } from '@/util';
import { Step } from '../utils';
import { userInfoAtom } from '@/atoms';

export interface AddProxyFormProps {
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  onSuccess: () => void;
}

const AddProxyForm = ({ setStep, onSuccess }: AddProxyFormProps) => {
  const [uid, setUid] = useState('');
  const myInfo = useAtomValue(userInfoAtom);
  const myId = myInfo.id;
  const onConfirm = async () => {
    try {
      const _uid = uid.trim();
      if (getRealId(_uid) === myId) {
        toastError(`Can't grant permission to yourself`);
        return;
      }
      if (!_uid) {
        return;
      }
      if (!isSearchMatchId(_uid)) {
        toastError(`uid format error`);

        return;
      }

      await addProxyPermission(getRealId(_uid));
      toastSuccess('Granted!');
      setStep(Step.Proxy);
      onSuccess();
    } catch (error: any) {
      toastError(error?.message || `add permission fail, try again later!`);
    }
  };

  return (
    <div style={{ padding: '28px 16px 16px' }}>
      <div style={{ marginBottom: '8px' }} className="dsw-shared-typography-p3">
        <span style={{ color: 'rgb(248, 65, 53)' }}>*</span>Enter the UID you would like to grant:
      </div>
      <Input
        style={{
          background: 'var(--dsw-color-bg-popup)',
        }}
        key="name"
        placeholder="e.g. 71234567890"
        value={uid}
        onChange={e => setUid(e.target.value?.trim())}
      />
      <div
        style={{
          fontSize: '12px',
          color: `var(--dsw-color-text-secondary)`,
          marginTop: '24px',
          alignItems: 'flex-start',
        }}
      >
        NOTE: Once you granted, he/she will have access to manage your calendar, such as: <br />
        <br />
        1. View all events <br />
        <br />
        2. Create meetings <br />
        <br />
        3. Edit meetings <br />
        <br />
        4. Cancel meetings
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
        <Button
          size="large"
          key="ok"
          disabled={!uid}
          type="primary"
          onClick={onConfirm}
          style={{ width: '100%' }}
        >
          Grant
        </Button>
      </div>
    </div>
  );
};

export default AddProxyForm;
