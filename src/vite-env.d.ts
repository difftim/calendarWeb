/// <reference types="vite/client" />
declare global {
  interface Window {
    CALENDAR_API: {
      ourNumber: string;
      i18n: (key: string, values?: Array<string>) => string;
      isWebApiReady: () => Promise<void>;
      registerMeetingUpdateIpc: (callback: (meetings: any) => void) => void;
      getMeetingsFromReduxStore: () => Promise<Record<string, any>>;
      fetchGlobalConfig: () => Promise<Record<string, any>>;
      getConversationFromMainThread: () => Promise<unknown[]>;
    };
    globalConfig: Record<string, any>;
  }
}

export {};
