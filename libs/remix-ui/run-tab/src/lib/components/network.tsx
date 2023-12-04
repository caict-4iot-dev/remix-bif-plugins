import React, {useState, useEffect} from 'react'
import Popover from 'react-bootstrap/Popover'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import {logHtml} from '../actions'
import { getAccountBalance } from '../bif/bif-service'

export const InputTooltip = ({text, enabled = true, children}: any) => {
  if (!enabled) {
    return children
  }

  return (
    <OverlayTrigger
      placement="bottom-start"
      trigger={['hover', 'focus']}
      overlay={
        <Popover className="bg-light" id="popover-basic">
          <Popover.Content>{text}</Popover.Content>
        </Popover>
      }
    >
      {children}
    </OverlayTrigger>
  )
}

export function NetworkUI(props: {bif: any; setBif: any}) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState('Disconnected')
  const [nodeUrl, setNodeUrl] = useState('http://test.bifcore.bitfactory.cn')
  const [browserUrl, setBrowserUrl] = useState('https://test-bj-explorer.bitfactory.cn')
  const [privateKey, setPrivateKey] = useState('')
  const [balance, setBalance] = useState(0)

  const {bif, setBif} = props

  useEffect(() => {
    setNodeUrl(bif.nodeUrl || 'http://test.bifcore.bitfactory.cn')
    setBrowserUrl(bif.browserUrl || 'https://test-bj-explorer.bitfactory.cn')
    setPrivateKey(bif.privateKey)
    setStatus(bif.status)
    setBalance(bif.balance)
  }, [bif])

  const onEdit = () => {
    setEditing(true)
  }
  const onCancel = () => {
    setEditing(false)
    setNodeUrl(bif.nodeUrl)
    setBrowserUrl(bif.browserUrl)
    setPrivateKey(bif.privateKey)
  }
  const onSave = async () => {
    setStatus('Connecting...')

    const resp = await getAccountBalance(nodeUrl, privateKey)
    if (resp.code !== 'SUCCESS') {
      setStatus('Disconnected')
      logHtml(resp.message)
      return
    }

    setStatus('Connected')
    setBalance(resp.detail)
    setEditing(false)
    setBif({
      nodeUrl,
      browserUrl,
      privateKey,
      status: 'Connected',
      balance: resp.detail,
    })
  }

  const onRefresh = async () => {
    await onSave()
  }

  return (
    <form id="network-form" style={networkStyle}>
      <div style={txMetaRowStyle}>
        <div style={labelStyle}>节点地址</div>
        <InputTooltip enabled={editing} text="星火链网节点地址，比如：http://test.bifcore.bitfactory.cn">
          <input className="form-control" id="node-url" type="text" disabled={!editing} value={nodeUrl} onChange={(e) => setNodeUrl(e.target.value)} />
        </InputTooltip>
      </div>

      <div style={txMetaRowStyle}>
        <div style={labelStyle}>区块链浏览器地址</div>
        <InputTooltip enabled={editing} text="星火链网区块链浏览器地址，比如：https://test-bj-explorer.bitfactory.cn">
          <input className="form-control" id="node-url" type="text" disabled={!editing} value={browserUrl} onChange={(e) => setNodeUrl(e.target.value)} />
        </InputTooltip>
      </div>

      <div style={txMetaRowStyle}>
        <div style={labelStyle}>私钥</div>
        <InputTooltip enabled={editing} text="星火链网私钥">
          <input type='password' className="form-control" id="private-key" disabled={!editing} value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
        </InputTooltip>
      </div>
      <div style={txMetaRowStyle}>
        <div style={labelStyle}>账户余额：{balance ? balance / 100000000 : 0} XHT</div>
      </div>
      {editing ? (
        <div style={txMetaRowRightStyle}>
          <i style={iconStyle} className="fa fa-times" onClick={() => onCancel()} />
          <i style={iconStyle} className="fa fa-save" onClick={() => onSave()} />
        </div>
      ) : (
        <div style={txMetaRowRightStyle}>
          <div id="connection-status" style={statusStyle(status)}>
            {status}
          </div>
          <i style={iconStyle} className="fa fa-sync" onClick={() => onRefresh()} />
          <i style={iconStyle} className="fa fa-edit" onClick={() => onEdit()} />
        </div>
      )}
    </form>
  )
}

export const bootstrapSelectStyle: any = {
  paddingRight: '20px !important',
}

export const networkStyle: any = {
  display: 'flex',
  alignItems: 'flex-end',
  flexDirection: 'column',
  width: '100%',
}

export const iconStyle: any = {
  cursor: 'pointer',
  minWidth: 28,
  textAlign: 'center',
  fontSize: 16,
  padding: 8,
  verticalAlign: 'center',
  textDecoration: 'none',
}

export const txMetaRowStyle: any = {
  paddingTop: 10,
  width: '100%',
}

export const txMetaRowRightStyle: any = {
  display: 'flex',
  alignItems: 'center',
  paddingTop: 4,
  justifyContent: 'flex-end',
}

export const labelStyle: any = {
  fontSize: 12,
  whiteSpace: 'nowrap',
  minWidth: 60,
}

export const statusStyle = (status: string) => {
  let color
  if (status === 'Connected') {
    color = 'green'
  } else if (status === 'Connecting...') {
    color = 'yellow'
  } else {
    color = 'red'
  }
  return {
    color,
    fontSize: 11,
    marginRight: 8,
  }
}
