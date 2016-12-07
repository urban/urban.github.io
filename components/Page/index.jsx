// @flow
import React from 'react'
import styles from './styles.module.css'

export default class SitePage extends React.Component {
  render () {
    const { route } = this.props
    const post = route.page.data

    return (
      <div className={styles.root}>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.body }} />
      </div>
    )
  }
}
