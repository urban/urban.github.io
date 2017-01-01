// @flow
import React from 'react'
import styles from './_template.module.css'
import SiteHeader from 'components/SiteHeader'
import SiteFooter from 'components/SiteFooter'

import '../static/css/reset.css'
import '../static/css/base.css'

export default class Template extends React.Component {
  render () {
    return (
      <div className={styles.root}>
        <SiteHeader {...this.props} />
        <main className={styles.main}>
          { this.props.children }
        </main>
        <SiteFooter {...this.props} />
      </div>
    )
  }
}
