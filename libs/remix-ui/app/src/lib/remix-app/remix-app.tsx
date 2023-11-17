import React, {useEffect, useRef, useState} from 'react'
import './style/remix-app.css'
import {RemixUIMainPanel} from '@remix-ui/panel'
import MatomoDialog from './components/modals/matomo'
import OriginWarning from './components/modals/origin-warning'
import DragBar from './components/dragbar/dragbar'
import {AppProvider} from './context/provider'
import AppDialogs from './components/modals/dialogs'
import DialogViewPlugin from './components/modals/dialogViewPlugin'
import {AppContext} from './context/context'
import {IntlProvider, FormattedMessage} from 'react-intl'
import {CustomTooltip} from '@remix-ui/helper'

interface IRemixAppUi {
  app: any
}
const RemixApp = (props: IRemixAppUi) => {
  const [appReady, setAppReady] = useState<boolean>(false)
  const [hideSidePanel, setHideSidePanel] = useState<boolean>(false)
  const [maximiseTrigger, setMaximiseTrigger] = useState<number>(0)
  const [resetTrigger, setResetTrigger] = useState<number>(0)
  const [locale, setLocale] = useState<{code: string; messages: any}>({
    code: 'en',
    messages: {}
  })
  const sidePanelRef = useRef(null)

  useEffect(() => {
    async function activateApp() {
      props.app.themeModule.initTheme(() => {
        setAppReady(true)
        props.app.activate()
        setListeners()
      })
      setLocale(props.app.localeModule.currentLocale())
    }
    if (props.app) {
      activateApp()
    }
  }, [])

  function setListeners() {
    props.app.sidePanel.events.on('toggle', () => {
      setHideSidePanel((prev) => {
        return !prev
      })
    })
    props.app.sidePanel.events.on('showing', () => {
      setHideSidePanel(false)
    })

    props.app.layout.event.on('minimizesidepanel', () => {
      // the 'showing' event always fires from sidepanel, so delay this a bit
      setTimeout(() => {
        setHideSidePanel(true)
      }, 1000)
    })

    props.app.layout.event.on('maximisesidepanel', () => {
      setMaximiseTrigger((prev) => {
        return prev + 1
      })
    })

    props.app.layout.event.on('resetsidepanel', () => {
      setResetTrigger((prev) => {
        return prev + 1
      })
    })
    props.app.localeModule.events.on('localeChanged', (nextLocale) => {
      setLocale(nextLocale)
    })
  }

  const value = {
    settings: props.app.settings,
    showMatamo: props.app.showMatamo,
    appManager: props.app.appManager,
    modal: props.app.notification,
    layout: props.app.layout
  }

  return (
    //@ts-ignore
    <IntlProvider locale={locale.code} messages={locale.messages}>
      <AppProvider value={value}>
        <OriginWarning></OriginWarning>
        <MatomoDialog hide={!appReady}></MatomoDialog>
        <div className={`remixIDE ${appReady ? '' : 'd-none'}`} data-id="remixIDE">
          <div id="icon-panel" data-id="remixIdeIconPanel" className="custom_icon_panel iconpanel bg-light">
            {props.app.menuicons.render()}
          </div>
          <div ref={sidePanelRef} id="side-panel" data-id="remixIdeSidePanel" className={`sidepanel border-right border-left ${hideSidePanel ? 'd-none' : ''}`}>
            {props.app.sidePanel.render()}
          </div>
          <DragBar
            resetTrigger={resetTrigger}
            maximiseTrigger={maximiseTrigger}
            minWidth={285}
            refObject={sidePanelRef}
            hidden={hideSidePanel}
            setHideStatus={setHideSidePanel}
          ></DragBar>
          <div id="main-panel" data-id="remixIdeMainPanel" className="mainpanel d-flex">
            <RemixUIMainPanel Context={AppContext}></RemixUIMainPanel>
            <CustomTooltip placement="bottom" tooltipId="overlay-tooltip-all-tabs" tooltipText={<FormattedMessage id="remixApp.scrollToSeeAllTabs" />}>
              <div className="remix-ui-tabs_end remix-bg-opacity position-absolute position-fixed"></div>
            </CustomTooltip>
          </div>
        </div>
        <div>{props.app.hiddenPanel.render()}</div>
        <AppDialogs></AppDialogs>
        <DialogViewPlugin></DialogViewPlugin>
      </AppProvider>
    </IntlProvider>
  )
}

export default RemixApp
