import React, {useState, useEffect} from 'react'
import { IntlProvider } from 'react-intl';
import {zhJson} from '@remixproject/locales';

import {DebuggerUI} from '@remix-ui/debugger-ui' // eslint-disable-line

import {DebuggerClientApi} from './debugger'

const remix = new DebuggerClientApi()

export const App = () => {
  const [isLoad, setIsLoad] = useState(false);

  useEffect(() => {
    remix.onload(() => {
      setIsLoad(true);
    });
  }, []);
  return isLoad ? (
    <IntlProvider locale="zh" messages={zhJson.default}>
      <DebuggerUI debuggerAPI={remix} />
    </IntlProvider>
  ) : null;
}

export default App
