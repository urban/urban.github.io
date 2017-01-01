// @flow
import React from 'react'
import R from 'ramda'
import DocumentTitle from 'react-document-title'
// $FlowFixMe
import { config } from 'config'
import PostExcerpt from 'components/PostExcerpt'
import styles from './_styles.module.css'

export default class SiteIndex extends React.Component {
  render () {
    return (
      <DocumentTitle title={config.siteTitle}>
        <ul className={styles.root}>
          {R.compose(
            mapIndexed((x, idx) => <li key={idx}>{x}</li>),
            postExcerpts
          )(this.props)}
        </ul>
      </DocumentTitle>
    )
  }
}

const mapIndexed = R.addIndex(R.map)
const isAricle = R.both(
  R.pathEq(['file', 'ext'], 'md'),
  R.pathEq(['file', 'dirname'], 'articles')
)
const sortByDate = R.compose(
  R.reverse,
  R.sortBy(R.pathOr('', ['data', 'date']))
)
const getProps = R.converge(
  R.merge,
  [
    R.compose(
      R.pick(['title', 'description', 'date', 'category']),
      R.prop('data')
    ),
    R.pick(['path'])
  ]
)
const postExcerpts = R.compose(
  R.map(R.compose(
    (props) => React.createElement(PostExcerpt, props),
    getProps
  )),
  sortByDate,
  R.filter(isAricle),
  R.path(['route', 'pages'])
)
