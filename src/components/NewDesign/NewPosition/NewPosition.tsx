import { Grid, Typography } from '@material-ui/core'
import React, { useState, useRef } from 'react'
import PositionSettings from '../Modals/PositionSettings/PositionSettings'
import DepositSelector from './DepositSelector/DepositSelector'
import RangeSelector from './RangeSelector/RangeSelector'
import settingsIcon from '@static/svg/settings_ic.svg'
import useStyles from './style'
import { printBN } from '@consts/utils'
import { BN } from '@project-serum/anchor'
import { SwapToken } from '@selectors/solanaWallet'

export interface INewPosition {
  tokens: SwapToken[]
  data: Array<{ x: number; y: number }>
  midPriceIndex: number
  addLiquidityHandler: (
    token1Amount: BN,
    token2Amount: BN,
    leftTickIndex: number,
    rightTickIndex: number,
    slippageTolerance: number
  ) => void
  onChangePositionTokens: (token1Index: number | null, token2index: number | null, feeTierIndex: number) => void
  isCurrentPoolExisting: boolean
  calcCurrentPoolProportion: (
    leftRangeTickIndex: number,
    rightRangeTickIndex: number
  ) => number
  feeTiers: number[]
  initialSlippageTolerance: number
}

export const INewPosition: React.FC<INewPosition> = ({
  tokens,
  data,
  midPriceIndex,
  addLiquidityHandler,
  onChangePositionTokens,
  isCurrentPoolExisting,
  calcCurrentPoolProportion,
  feeTiers,
  initialSlippageTolerance
}) => {
  const classes = useStyles()

  const settingsRef = useRef<HTMLDivElement>(null)

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const [slippageTolerance, setSlippageTolerance] = useState<number>(1)

  const [leftRange, setLeftRange] = useState(0)
  const [rightRange, setRightRange] = useState(0)

  const [token1Index, setToken1Index] = useState<number | null>(null)
  const [token2Index, setToken2Index] = useState<number | null>(null)

  const setInputBlockerInfo = (isSingleAsset: boolean) => {
    if (isSingleAsset) {
      return 'Current price outside range. Single-asset deposit only.'
    }

    return ''
  }

  const setRangeBlockerInfo = () => {
    if (token1Index === null || token2Index === null) {
      return 'Select tokens to set price range.'
    }

    if (!isCurrentPoolExisting) {
      return 'Pool is not existent.'
    }

    return ''
  }

  const noRangePlaceholderProps = {
    data: Array(10).fill(1).map((_e, index) => ({ x: index, y: index })),
    midPriceIndex: 5,
    tokenFromSymbol: 'ABC',
    tokenToSymbol: 'XYZ'
  }

  return (
    <Grid container className={classes.wrapper}>
      <Grid container className={classes.top} direction='row' justifyContent='space-between' alignItems='center'>
        <Typography className={classes.title}>Add new liquidity position</Typography>

        <Grid
          className={classes.settings}
          ref={settingsRef}
          onClick={() => { setSettingsOpen(true) }}
          container
          item
          alignItems='center'
        >
          <img className={classes.settingsIcon} src={settingsIcon} />
          <Typography className={classes.settingsText}>Position settings</Typography>
        </Grid>
      </Grid>

      <Grid container direction='row' justifyContent='space-between'>
        <DepositSelector
          tokens={tokens}
          setPositionTokens={(index1, index2, fee) => {
            setToken1Index(index1)
            setToken2Index(index2)
            onChangePositionTokens(index1, index2, fee)
          }}
          token1Max={token1Index !== null ? +printBN(tokens[token1Index].balance, tokens[token1Index].decimal) : 0}
          token2Max={token2Index !== null ? +printBN(tokens[token2Index].balance, tokens[token2Index].decimal) : 0}
          onAddLiquidity={
            (token1Amount, token2Amount) => {
              if (token1Index !== null && token2Index !== null) {
                addLiquidityHandler(
                  token1Amount,
                  token2Amount,
                  leftRange,
                  rightRange,
                  slippageTolerance
                )
              }
            }
          }
          token1InputState={{
            blocked: token1Index !== null && token2Index !== null && rightRange < midPriceIndex,
            blockerInfo: setInputBlockerInfo(rightRange < midPriceIndex)
          }}
          token2InputState={{
            blocked: token1Index !== null && token2Index !== null && leftRange > midPriceIndex,
            blockerInfo: setInputBlockerInfo(leftRange > midPriceIndex)
          }}
          calcCurrentPoolProportion={calcCurrentPoolProportion}
          leftRangeTickIndex={leftRange}
          rightRangeTickIndex={rightRange}
          feeTiers={feeTiers}
          isCurrentPoolExisting={isCurrentPoolExisting}
        />

        <RangeSelector
          onChangeRange={
            (left, right) => {
              setLeftRange(left)
              setRightRange(right)
            }
          }
          blocked={token1Index === null || token2Index === null || !isCurrentPoolExisting}
          blockerInfo={setRangeBlockerInfo()}
          {
          ...(
            token1Index === null || token2Index === null || !isCurrentPoolExisting
              ? noRangePlaceholderProps
              : {
                data,
                midPriceIndex,
                tokenFromSymbol: tokens[token1Index].symbol,
                tokenToSymbol: tokens[token2Index].symbol
              }
          )
          }
        />
      </Grid>

      <PositionSettings
        open={settingsOpen}
        anchorEl={settingsRef.current}
        handleClose={() => { setSettingsOpen(false) }}
        slippageTolerance={slippageTolerance}
        onChangeSlippageTolerance={setSlippageTolerance}
        autoSetSlippageTolerance={() => { setSlippageTolerance(initialSlippageTolerance) }}
      />
    </Grid>
  )
}

export default INewPosition
