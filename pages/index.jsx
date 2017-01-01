// @flow
import React from 'react'
import DocumentTitle from 'react-document-title'
// $FlowFixMe
import { config } from 'config'
import styles from './_styles.module.css'

export default class SiteIndex extends React.Component {
  render () {
    return (
      <DocumentTitle title={config.siteTitle}>
        <div className={styles.root}>
          <blockquote className={styles.quote}>
            <p>I love to work at the intersection between great technology, user experience and design. I can see the big picture and I care about the details. I can move fluidly between disciplines and I bridge the gap between design and implementation. Simply put, I like to take ideas and transform them into reality.</p>
            <p>– Urban</p>
          </blockquote>
        </div>
      </DocumentTitle>
    )
  }
}
