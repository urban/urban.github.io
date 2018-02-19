// @flow
import React from 'react'

export default class SitePage extends React.Component {
  render() {
    const {route} = this.props
    const post = route.page.data

    return (
      <div style={{marginBottom: '4rem'}}>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{__html: post.body}} />
      </div>
    )
  }
}
