// @flow
import React from 'react'

export type Props = {
  children?: React.Element<*> | Array<React.Element<*>> | null,
  viewBox?: string,
  className?: string,
}

export default function Icon({
  children,
  viewBox = '0 0 16 16',
  className = '',
}: Props) {
  return (
    <span className={`icon ${className}`}>
      <svg viewBox={viewBox}>{children}</svg>
    </span>
  )
}
