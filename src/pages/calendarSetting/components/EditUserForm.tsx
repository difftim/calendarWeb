import React, { useEffect, useState } from 'react';

import Input from '@/shared/Input';
import { IconTablerCheck } from '@/shared/IconsNew';

export interface EditUserFormProps {
  name?: string;
  onConfirm: (nextName: string) => void;
}

const EditUserForm = ({ name = '', onConfirm }: EditUserFormProps) => {
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  return (
    <div className="calendar-setting-edit-form">
      <Input
        placeholder="Enter user name"
        value={value}
        onChange={e => setValue(e.target.value?.slice(0, 30) || '')}
      />
      <div onClick={() => onConfirm(value)} style={{ cursor: 'pointer' }}>
        <IconTablerCheck />
      </div>
    </div>
  );
};

export default EditUserForm;

