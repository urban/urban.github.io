// @flow
import React from 'react'
// $FlowFixMe
import { config } from 'config'
import moment from 'moment'

import styles from './styles.module.css'

export default class SiteFooter extends React.Component {
  render () {
    return (
      <footer className={styles.root}>
        <div className={styles.content}>
          <span>&copy; {config.siteAuthor} 2013&mdash;{moment().format('YYYY')}</span>
        </div>
      </footer>
    )
  }
}
