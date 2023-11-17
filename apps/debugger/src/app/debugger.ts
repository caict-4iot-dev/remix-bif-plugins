import { PluginClient } from "@remixproject/plugin";
import { createClient } from "@remixproject/plugin-webview";
import { IDebuggerApi } from '@remix-ui/debugger-ui'
import { DebuggerApiMixin } from '@remix-ui/debugger-ui'

export class DebuggerClientApi extends DebuggerApiMixin(PluginClient) {
  constructor () {
    super()
    createClient(this as any)
    this.initDebuggerApi()
  }

  offsetToLineColumnConverter: IDebuggerApi['offsetToLineColumnConverter']
  removeHighlights: boolean
}
