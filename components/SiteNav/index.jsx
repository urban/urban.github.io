// @flow
import React from 'react'
import { Link } from 'react-router'
import { prefixLink } from 'gatsby-helpers'

import styles from './styles.module.css'

export default class SiteNav extends React.Component {
  render () {
    const { location } = this.props
    const isActive = (x) => location.pathname === prefixLink(x)
    return (
      <nav className={styles.root}>
        <ul>
          <li>
            <Link to='/articles/' className={isActive('/articles/') ? styles.activeLink : styles.link}>
              Articles
            </Link>
          </li>
        </ul>
      </nav>
    )
  }
}
