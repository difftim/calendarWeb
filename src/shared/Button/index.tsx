import React from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import './Button.scss';

interface ButtonProps extends AntButtonProps {
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = props => {
  return <AntButton {...props} />;
};

export default Button;
