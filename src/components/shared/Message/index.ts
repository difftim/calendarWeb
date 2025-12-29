import { message } from 'antd';

export const toast = (content: string) => {
  message.success(content);
};

export const toastError = (content: string) => {
  message.error(content);
};

export const toastSuccess = (content: string) => {
  message.success(content);
};

export const toastWarning = (content: string) => {
  message.warning(content);
};

export const toastInfo = (content: string) => {
  message.info(content);
};
