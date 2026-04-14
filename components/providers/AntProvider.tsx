'use client';

import { ConfigProvider, App } from 'antd';
import { antdTheme } from '@/lib/theme';
import idID from 'antd/locale/id_ID';

export default function AntProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme} locale={idID}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
