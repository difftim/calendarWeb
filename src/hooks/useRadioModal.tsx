import React, { useRef } from 'react';
import { Modal, ModalFuncProps, Space } from 'antd';
import Radio, { RadioGroup } from '@/shared/Radio';
import ConfigProvider from '@/shared/ConfigProvider';

// 二次确认弹窗
export const useRadioModal = () => {
  const instanceRef = useRef<any>();
  const typeRef = useRef(1);

  const createContent = (
    hideRadio: boolean,
    isEvent: boolean,
    instanceRef: React.RefObject<any>,
    type = 1
  ) => {
    if (hideRadio) {
      return null;
    }
    return (
      <ConfigProvider>
        <RadioGroup
          style={{ margin: '16px 0' }}
          onChange={e => {
            const newValue = e.target.value;
            typeRef.current = newValue;
            instanceRef.current?.update({
              content: createContent(hideRadio, isEvent, instanceRef, newValue),
            });
          }}
          value={type}
        >
          <Space direction="vertical" size={16}>
            <Radio value={1}>{isEvent ? 'This event' : 'This meeting'}</Radio>
            <Radio value={2}>{isEvent ? 'All events' : 'All meetings'}</Radio>
          </Space>
        </RadioGroup>
      </ConfigProvider>
    );
  };

  const closeModal = () => {
    instanceRef.current?.destroy();
    instanceRef.current = null;
    typeRef.current = 1;
  };

  const openModal = (
    props: ModalFuncProps & {
      isEvent?: boolean;
      hideRadio?: boolean;
    }
  ) => {
    const { hideRadio = false, isEvent = false } = props;
    const content = createContent(hideRadio, isEvent, instanceRef, typeRef.current);

    closeModal();

    return new Promise<{ ok: boolean; allEvent?: boolean }>(resolve => {
      instanceRef.current = Modal.confirm({
        className: 'common-confirm-radio-modal',
        icon: null,
        closeIcon: null,
        width: 384,
        style: { padding: '24px' },
        content,
        onOk: () => {
          resolve({
            ok: true,
            allEvent: hideRadio ? false : typeRef.current == 2,
          });
          closeModal();
        },
        onCancel: () => {
          resolve({ ok: false });
          closeModal();
        },
        cancelButtonProps: {
          className: 'double-confirm-radio-modal-cancel-button',
        },
        ...props,
      });
    });
  };

  return {
    openModal,
  };
};
