// @flow
import React from 'react'
// $FlowFixMe
import {config} from 'config'
import {prefixLink} from 'gatsby-helpers'
import Link from 'gatsby-link'
import SiteNav from '../SiteNav'
import {Logo} from '../Icons'

import './SiteHeader.css'

export default class SiteHeader extends React.Component {
  render() {
    return (
      <header>
        <div className="site-header">
          <Link to={prefixLink('/')}>
            <Logo className="site-header__logo" />
            <span className="site-header__title">{config.siteTitle}</span>
          </Link>
          <SiteNav {...this.props} />
        </div>
      </header>
    )
  }
}
