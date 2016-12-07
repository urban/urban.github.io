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
        <div className={styles.wrapper}>
          <div className={styles.content}>
            { this.props.children }
          </div>
        </div>
        <SiteFooter {...this.props} />
      </div>
    )
  }
}

Template.propTypes = {
  children: React.PropTypes.any,
  location: React.PropTypes.object,
  route: React.PropTypes.object
}
