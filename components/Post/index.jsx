// @flow
import React from 'react'
import moment from 'moment'
import styles from './styles.module.css'
import PostFooter from 'components/PostFooter'

import '../../static/css/highlight.css'

const publishDate = (x) => moment(x).format('D MMM YYYY')

export default class Post extends React.Component {
  render () {
    const { route } = this.props
    const post = route.page.data

    return (
      <article className={styles.root}>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.body }} />
        <div className={styles.datePublished}>
          <em>Published {publishDate(post.date)} in {post.category} with tags: {post.tags.join(', ')}.</em>
        </div>
        <PostFooter {...this.props} />
      </article>
    )
  }
}
