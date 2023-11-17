/* eslint-disable no-use-before-define */
import React, {useState, useEffect} from 'react'
import { IntlProvider } from 'react-intl';
import {zhJson} from '@remixproject/locales';

import {SolidityCompiler} from '@remix-ui/solidity-compiler' // eslint-disable-line

import {CompilerClientApi} from './compiler'

const remix = new CompilerClientApi()

export const App = () => {
  const [isLoad, setIsLoad] = useState(false);

  useEffect(() => {
    remix.onload(() => {
      setIsLoad(true);
    });
  }, []);
  return isLoad ? (
    <IntlProvider locale="zh" messages={zhJson.default}>
      <SolidityCompiler api={remix} />
    </IntlProvider>
  ) : null;
}

export default App
