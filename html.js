// @flow
import React from 'react'
import DocumentTitle from 'react-document-title'
import { prefixLink } from 'gatsby-helpers'

const BUILD_TIME = new Date().getTime()

module.exports = class HTML extends React.Component {
  render () {
    const { body } = this.props
    return (
      <html lang='en'>
        <head>
          <meta charSet='utf-8' />
          <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
          <meta name='viewport' content='width=device-width, initial-scale=1.0 maximum-scale=5.0' />
          <title>
            { DocumentTitle.rewind() }
          </title>
          <link
            href='https://fonts.googleapis.com/css?family=Roboto:400,400italic,500,700&subset=latin,cyrillic'
            rel='stylesheet'
            type='text/css'
          />
          { process.env.NODE_ENV === 'production'
              // $FlowFixMe
              ? <style dangerouslySetInnerHTML={{ __html: require('!raw!./public/styles.css') }} />
              : null
          }
        </head>
        <body>
          <div id='react-mount' dangerouslySetInnerHTML={{ __html: body }} />
          <script src={prefixLink(`/bundle.js?t=${BUILD_TIME}`)} />
        </body>
      </html>
    )
  }
}
