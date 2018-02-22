// @flow
import React from "react"
import DocumentTitle from "react-document-title"
import Repo from "../../components/Repo"
// $FlowFixMe
import R from "ramda"
import {Future} from "ramda-fantasy"

import "./projects.css"

export default class SiteIndex extends React.Component {
  state = {repos: []}

  componentDidMount() {
    getRepos("https://api.github.com/users/urban/repos").fork(
      console.error,
      repos => this.setState({repos}),
    )
  }

  render() {
    const {repos} = this.state
    return (
      <DocumentTitle title={siteTitle(this.props.data)}>
        <div>
          <h1>Projects</h1>
          <div className="repos">
            {R.map(({id, ...props}) => <Repo key={id} {...props} />, repos)}
          </div>
        </div>
      </DocumentTitle>
    )
  }
}

const siteTitle = R.path(["site", "siteMetadata", "title"])

const fetch = url =>
  new Future((rej, res) => {
    const req = new XMLHttpRequest()
    req.addEventListener(
      "load",
      function() {
        this.status === 200 ? res(this.responseText) : rej(this.responseText)
      },
      false,
    )
    req.addEventListener("error", rej, false)
    req.addEventListener("abort", rej, false)
    req.open("GET", url, true)
    req.send()
  })

const parseJSON = str =>
  new Future((rej, res) => {
    try {
      res(JSON.parse(str))
    } catch (err) {
      rej({error: err})
    }
  })

const repoData = R.pick([
  "id",
  "name",
  "html_url",
  "description",
  "language",
  "created_at",
  "updated_at",
])

const getRepos = R.compose(
  R.map(
    R.compose(
      R.map(repoData),
      R.reverse,
      R.sortBy(R.prop("updated_at")),
      R.filter(R.propEq("fork", false)),
    ),
  ),
  R.chain(parseJSON),
  fetch,
)
