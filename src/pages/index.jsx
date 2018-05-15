// @flow
import React from "react"
import {path} from "ramda"
import DocumentTitle from "react-document-title"

const siteTitle = path(["site", "siteMetadata", "title"])

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    position: "absolute",
  },
  quote: {
    fontSize: "1.5rem",
  },
}
export default class SiteIndex extends React.Component {
  render() {
    return (
      <DocumentTitle title={siteTitle(this.props.data)}>
        <div style={styles.root}>
          <blockquote style={styles.quote}>
            <p>
              I love to work at the intersection between great technology, user
              experience and design. I can see the big picture and I care about
              the details. I can move fluidly between disciplines and I bridge
              the gap between design and implementation. Simply put, I like to
              take ideas and transform them into reality.
            </p>
            <p>– Urban</p>
          </blockquote>
        </div>
      </DocumentTitle>
    )
  }
}
