// @flow
import React from 'react'
import DocumentTitle from 'react-document-title'
import Post from '../src/components/Post'
import Page from '../src/components/Page'
// $FlowFixMe
import {config} from 'config'

type Props = {
  route: {
    page: {
      data: {
        title: string,
        layout: 'page' | 'post',
      },
    },
  },
}

export default function MarkdownWrapper(props: Props) {
  const post = props.route.page.data

  return (
    <DocumentTitle title={`${post.title} - ${config.siteTitle}`}>
      {React.createElement(post.layout !== 'page' ? Post : Page, props)}
    </DocumentTitle>
  )
}
