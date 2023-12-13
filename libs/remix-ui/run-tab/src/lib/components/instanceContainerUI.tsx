// eslint-disable-next-line no-use-before-define
import { CustomTooltip } from '@remix-ui/helper'
import React from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { InstanceContainerProps } from '../types'
import { UniversalDappUI } from './universalDappUI'

export function InstanceContainerUI(props: any) {
  const { instanceList } = props.instances

  const clearInstance = () => {
    props.clearInstances()
  }

  const intl = useIntl()

  return (
    <div className="udapp_instanceContainer mt-3 border-0 list-group-item">
      <div className="d-flex justify-content-between align-items-center pl-2 mb-2">
        <CustomTooltip placement="top-start" tooltipClasses="text-nowrap" tooltipId="deployAndRunClearInstancesTooltip" tooltipText={<FormattedMessage id="udapp.tooltipText6" />}>
          <label className="udapp_deployedContracts">
            <FormattedMessage id="udapp.deployedContracts" />
          </label>
        </CustomTooltip>
        {instanceList.length > 0 ? (
          <CustomTooltip
            placement="right"
            tooltipClasses="text-nowrap"
            tooltipId="deployAndRunClearInstancesTooltip"
            tooltipText={<FormattedMessage id="udapp.deployAndRunClearInstances" />}
          >
            <i className="mr-1 udapp_icon far fa-trash-alt" data-id="deployAndRunClearInstances" onClick={clearInstance} aria-hidden="true"></i>
          </CustomTooltip>
        ) : null}
      </div>
      {instanceList.length > 0 ? (
        <div>
          {' '}
          {props.instances.instanceList.map((instance, index) => {
            return (
              <UniversalDappUI
                key={index}
                instance={instance}
                context={props.getContext()}
                removeInstance={props.removeInstance}
                index={index}
                gasEstimationPrompt={props.gasEstimationPrompt}
                passphrasePrompt={props.passphrasePrompt}
                mainnetPrompt={props.mainnetPrompt}
                runTransactions={props.runTransactions}
                sendValue={props.sendValue}
                getFuncABIInputs={props.getFuncABIInputs}
                bifStatus={props.bifStatus}
                txStatus={props.txStatus}
              />
            )
          })}
        </div>
      ) : (
        <span className="mx-2 mt-3 alert alert-warning" data-id="deployAndRunNoInstanceText" role="alert">
          <FormattedMessage id="udapp.deployAndRunNoInstanceText" />
        </span>
      )}
    </div>
  )
}
