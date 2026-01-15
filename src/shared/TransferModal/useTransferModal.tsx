import React, { PropsWithChildren, useRef } from 'react';
import { Modal } from 'antd';

import { TransferModalStoreProvider } from './TransferModalContext';

export type ExcludeOnClose<T> = T extends { onClose: () => void }
  ? Omit<T, 'onClose'>
  : T;

export const useTransferModalWithContent = <T extends unknown>(
  TransferModalContent: React.FC<T>
) => {
  const lock = useRef(false);

  const showTransferModal = (
    props: ExcludeOnClose<T> & { afterClose?: () => void; zIndex?: number }
  ) => {
    if (lock.current) {
      return;
    }

    lock.current = true;

    const { zIndex, ...rest } = props;

    const mergedProps = {
      ...rest,
      onClose() {
        lock.current = false;
        destroy();
        props.afterClose?.();
      },
    } as PropsWithChildren<T>;

    const { destroy } = Modal.confirm({
      centered: true,
      width: 654,
      icon: null,
      content: (
        <TransferModalStoreProvider>
          <TransferModalContent {...mergedProps} />
        </TransferModalStoreProvider>
      ),
      onCancel: () => {
        lock.current = false;
      },
      afterClose() {
        lock.current = false;
        props.afterClose?.();
      },
      footer: null,
      ...(zIndex !== undefined ? { zIndex } : {}),
    });

    return destroy;
  };

  return showTransferModal;
};
