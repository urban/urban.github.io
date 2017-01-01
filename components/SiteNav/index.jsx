// @flow
import React from 'react'
import { Link } from 'react-router'
import { prefixLink } from 'gatsby-helpers'

import styles from './styles.module.css'

export default class SiteNav extends React.Component {
  render () {
    const { location } = this.props
    const isActive = (x) => location.pathname === prefixLink(x)
    const styleFor = (x) => isActive(x) ? styles.activeLink : styles.link
    return (
      <nav className={styles.root}>
        <Link to='/articles/' className={styleFor('/articles/')}>
          Articles
        </Link>
        <Link to='/projects/' className={styleFor('/projects/')}>
          Projects
        </Link>
      {/*   <Link to='/work/' className={styleFor('/work/')}> */}
      {/*     Work */}
      {/*   </Link> */}
      </nav>
    )
  }
}
