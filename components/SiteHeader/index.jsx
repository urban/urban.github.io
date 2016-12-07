// @flow
import React from 'react'
// $FlowFixMe
import { config } from 'config'
import { prefixLink } from 'gatsby-helpers'
import { Link } from 'react-router'
import SiteNav from 'components/SiteNav'
import { Logo } from 'components/Icons'

import styles from './styles.module.css'

export default class SiteHeader extends React.Component {
  render () {
    return (
      <header className={styles.root}>
        <div className={styles.content}>
          <Link to={prefixLink('/')}>
            <Logo className={styles.logo} />
            <span className={styles.siteTitle}>{config.siteTitle}</span>
          </Link>
          <SiteNav {...this.props} />
        </div>
      </header>
    )
  }
}
