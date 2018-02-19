// @flow
import React from 'react'
import moment from 'moment'
import PostFooter from 'components/PostFooter'

const publishDate = x => moment(x).format('D MMM YYYY')

export default class Post extends React.Component {
  render() {
    const {route} = this.props
    const post = route.page.data

    return (
      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{__html: post.body}} />
        <div>
          <em>
            Published {publishDate(post.date)} in {post.category} with tags:{' '}
            {post.tags.join(', ')}.
          </em>
        </div>
        <PostFooter {...this.props} />
      </article>
    )
  }
}
