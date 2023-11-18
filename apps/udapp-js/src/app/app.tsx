/* eslint-disable no-use-before-define */
import React, { useEffect, useState } from 'react';
import { RunTabUI } from '@remix-ui/run-tab-js';
import { IntlProvider } from 'react-intl';
import {zhJson} from '@remixproject/locales';
import { UdappClientApi } from './udapp';

const remix: any = new UdappClientApi();

export const App = () => {
  const [isLoad, setIsLoad] = useState(false);

  useEffect(() => {
    remix.onload(() => {
      setIsLoad(true);
    });
  }, []);
  return isLoad ? (
    <IntlProvider locale="zh" messages={zhJson.default}>
      <RunTabUI plugin={remix} />
    </IntlProvider>
  ) : null;
};

export default App;
