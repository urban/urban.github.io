// @flow
import type {Props} from './Icon'

import React from 'react'
// eslint-disable-next-line no-duplicate-imports
import Icon from './Icon'

export default function Logo(props: Props) {
  return (
    <Icon {...props} viewBox="0 0 34 34">
      <path d="M33.012,6V2H18v4h1.007c-0.003,3.082-0.009,6.164-0.003,9.246c0.003,1.537,0.133,3.17-0.275,4.665
        c-0.638,2.339-2.646,2.987-4.882,2.987c-2.878,0-4.588-1.457-4.845-4.403c-0.07-0.81-0.043-1.629-0.043-2.44
        c0-4.685,0-9.37,0-14.055H4v11c0,2.611-0.257,5.426,0.399,7.975c1.18,4.588,4.694,6.418,9.1,6.491
        c4.468,0.075,8.647-1.571,10.017-6.233C24.282,18.623,24,16,24,13h8V9h-8V6H33.012z" />
    </Icon>
  )
}
