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
        <div className='content'>
          <ul className={styles.postList}>
            { R.compose(
                mapIndexed((x, idx) => <li key={idx}>{x}</li>),
                postExcerpts
              )(this.props)
            }
          </ul>
        </div>
      </DocumentTitle>
    )
  }
}

SiteIndex.propTypes = {
  route: React.PropTypes.object
}

const mapIndexed = R.addIndex(R.map)
const getPages = R.path(['route', 'pages'])
const isPost = R.both(
  R.pathEq(['file', 'ext'], 'md'),
  R.pathEq(['data', 'layout'], 'post')
)
const sortByDate = R.compose(
  R.reverse,
  R.sortBy(R.pathOr('', ['data', 'date']))
)
const createPost = R.compose(
  (props) => React.createElement(PostExcerpt, props),
  R.applySpec({
    title: R.path(['data', 'title']),
    description: R.path(['data', 'description']),
    datePublished: R.path(['data', 'date']),
    category: R.path(['data', 'category']),
    path: R.prop('path')
  })
)
const postExcerpts = R.compose(
  R.map(createPost),
  sortByDate,
  R.filter(isPost),
  getPages
)
