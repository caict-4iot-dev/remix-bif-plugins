// eslint-disable-next-line no-use-before-define
import {CustomTooltip} from '@remix-ui/helper'
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {GasPriceProps} from '../types'

export function GasPriceUI(props: GasPriceProps) {
  const handleGasLimit = (e) => {
    props.setGasFee(e.target.value)
  }

  return (
    <div className="udapp_crow">
      <label className="udapp_settingsLabel">
        <FormattedMessage id="udapp.gasLimit" />
      </label>
      <CustomTooltip placement={'right'} tooltipClasses="text-nowrap" tooltipId="remixGasPriceTooltip" tooltipText={<FormattedMessage id="udapp.tooltipText4" />}>
        <input type="number" className="form-control udapp_gasNval udapp_col2" id="gasLimit" value={props.gasLimit} onChange={handleGasLimit} />
      </CustomTooltip>
    </div>
  )
}
