import { atom, PrimitiveAtom, useAtom } from 'jotai';
import React, { PropsWithChildren, ReactNode, useContext, useMemo } from 'react';

interface TransferModalSharedData<T extends { id: string }> {
  dataSourceAtom: PrimitiveAtom<T[]>;
  payloadAtom: PrimitiveAtom<{ selected: T[]; [key: string]: any }>;
  searchTextAtom: PrimitiveAtom<string>;
  leftItemsAtom: PrimitiveAtom<T[]>;
  disabledItemsAtom: PrimitiveAtom<T[]>;
  noResultAtom: PrimitiveAtom<ReactNode>;
  loadingAtom: PrimitiveAtom<boolean>;
  searchLoadingAtom: PrimitiveAtom<boolean>;
}

export const TransferModalPropsContext = React.createContext<TransferModalSharedData<any>>(
  undefined as any
);

export const useTransferModalContext = <T extends { id: string }>() => {
  const sharedAtoms = useContext<TransferModalSharedData<T>>(TransferModalPropsContext);

  if (!sharedAtoms) {
    console.warn(
      `TransferModal context is undefined, please verify you are calling useTransferModalContext() as child of a <TransferModalStoreProvider> component.`
    );
  }

  return sharedAtoms;
};

export const TransferModalStoreProvider = <T extends { id: string }>(
  // React.PropsWithChildren not work here, stupid!!
  { children }: PropsWithChildren<{}>
) => {
  const value = useMemo(
    () => ({
      dataSourceAtom: atom<T[]>([]),
      payloadAtom: atom<{ selected: T[]; [key: string]: any }>({
        selected: [],
      }),
      searchTextAtom: atom(''),
      leftItemsAtom: atom<T[]>([]),
      disabledItemsAtom: atom<T[]>([]),
      noResultAtom: atom<ReactNode>(null),
      loadingAtom: atom(false),
      searchLoadingAtom: atom(false),
    }),
    []
  );

  return (
    <TransferModalPropsContext.Provider value={value}>
      {children}
    </TransferModalPropsContext.Provider>
  );
};

export const useTranferModalStore = <T extends { id: string }>() => {
  const {
    dataSourceAtom,
    leftItemsAtom,
    searchTextAtom,
    payloadAtom,
    loadingAtom,
    noResultAtom,
    disabledItemsAtom,
    searchLoadingAtom,
  } = useTransferModalContext<T>();

  const [dataSource, setDataSource] = useAtom(dataSourceAtom);
  const [searchText, setSearchText] = useAtom(searchTextAtom);
  const [leftItems, setLeftItems] = useAtom(leftItemsAtom);
  const [payload, setPayload] = useAtom(payloadAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [disabledItems, setDisabledItems] = useAtom(disabledItemsAtom);
  const [noResult, setNoResult] = useAtom(noResultAtom);
  const [searchLoading, setSearchLoading] = useAtom(searchLoadingAtom);

  return {
    dataSource,
    setDataSource,
    searchText,
    setSearchText,
    leftItems,
    setLeftItems,
    payload,
    setPayload,
    loading,
    setLoading,
    disabledItems,
    setDisabledItems,
    noResult,
    setNoResult,
    searchLoading,
    setSearchLoading,
  };
};
