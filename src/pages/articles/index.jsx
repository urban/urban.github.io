// @flow
import React from "react"
import R from "ramda"
import DocumentTitle from "react-document-title"
// $FlowFixMe
import PostExcerpt from "../../components/PostExcerpt"
import "./index.css"

export default class SiteIndex extends React.Component {
  render() {
    return (
      <DocumentTitle title={siteTitle(this.props.data)}>
        <ul>
          {R.compose(
            mapIndexed((x, idx) => <li key={idx}>{x}</li>),
            postExcerpts,
          )(this.props)}
        </ul>
      </DocumentTitle>
    )
  }
}

const siteTitle = R.path(["site", "siteMetadata", "title"])
const mapIndexed = R.addIndex(R.map)
const isAricle = R.both(
  R.pathEq(["file", "ext"], "md"),
  R.pathEq(["file", "dirname"], "articles"),
)
const sortByDate = R.compose(
  R.reverse,
  R.sortBy(R.pathOr("", ["data", "date"])),
)
const getProps = R.converge(R.merge, [
  R.compose(
    R.pick(["title", "description", "date", "category"]),
    R.prop("data"),
  ),
  R.pick(["path"]),
])
const postExcerpts = R.compose(
  R.map(R.compose(props => React.createElement(PostExcerpt, props), getProps)),
  sortByDate,
  R.filter(isAricle),
  R.path(["route", "pages"]),
)
