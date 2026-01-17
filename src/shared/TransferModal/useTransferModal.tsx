import React, { PropsWithChildren, useRef } from 'react';
import { Modal } from 'antd';
import { Provider } from 'jotai';

import { TransferModalStoreProvider } from './TransferModalContext';
import { store } from '@/atoms/store';

export type ExcludeOnClose<T> = T extends { onClose: () => void } ? Omit<T, 'onClose'> : T;

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
      className: 'dsw-transfer-modal-wrapper',
      content: (
        <Provider store={store}>
          <TransferModalStoreProvider>
            <TransferModalContent {...mergedProps} />
          </TransferModalStoreProvider>
        </Provider>
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
