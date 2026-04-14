import React from "react";
import { ConfigProvider, theme } from "antd";
import { PropsWithChildren } from "react";

const { darkAlgorithm } = theme;

export default function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#fcdfc2',
          colorSuccess: '#A3E635',
          colorWarning: '#FBBF24',
          colorError: '#EF4444',
          colorInfo: '#fcdfc2',
          colorTextBase: '#eeeeee',
          colorBgBase: '#181616',
          colorPrimaryBg: 'rgba(252, 223, 194, 0.08)',
          colorPrimaryBgHover: 'rgba(252, 223, 194, 0.12)',
          colorPrimaryBorder: 'rgba(252, 223, 194, 0.2)',
          colorPrimaryBorderHover: 'rgba(252, 223, 194, 0.3)',
          colorPrimaryHover: '#fde8d4',
          colorPrimaryActive: '#e8c4a8',
          colorPrimaryText: '#fcdfc2',
          colorPrimaryTextHover: '#fde8d4',
          colorText: '#eeeeee',
          colorTextSecondary: '#b4b4b4',
          colorTextTertiary: '#7a7a7a',
          colorBgContainer: '#352c2c',
          colorBgElevated: '#423838',
          colorBgLayout: '#181616',
          colorBorder: '#ec8c74',
          colorBorderSecondary: 'rgba(236, 140, 116, 0.2)',
          borderRadius: 16,
          borderRadiusLG: 20,
          borderRadiusSM: 8,
        },
        components: {
          Card: {
            colorBgContainer: '#352c2c',
            colorBorderSecondary: 'rgba(236, 140, 116, 0.2)',
          },
          Modal: {
            colorBgElevated: '#352c2c',
          },
          Button: {
            colorPrimary: '#fcdfc2',
            primaryColor: '#523833',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}