// @flow
import React from 'react'
import Link from 'gatsby-link'
import './Repo.css'

const nbsp = '\u00a0'

export default class Repo extends React.Component {
  render() {
    const {name, html_url, description, language} = this.props
    return (
      <section className="repo">
        <a style={{borderBottom: 'none'}} href={html_url} target="_blank">
          <header>
            <h4>
              {name}
              <small>{language || nbsp}</small>
            </h4>
          </header>
          <main>{description}</main>
        </a>
      </section>
    )
  }
}
