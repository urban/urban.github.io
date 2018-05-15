// @flow
import React from 'react'
// $FlowFixMe
import {config} from 'config'
import Link from 'gatsby-link'
import {GitHub, Twitter} from '../Icons'

import './PostFooter.css'

export default class PostFooter extends React.Component {
  render() {
    return (
      <footer className="post-footer">
        {/* <Link to={prefixLink('/about')}> */}
        <div className="post-footer__avatar" />
        {/* </Link> */}
        <div>
          <h4>Urban Faubion</h4>
          <p>
            Urban is a designer and developer with a love for creating digital
            products and services. He has a broad range of professional
            expertise in design, design research, interaction and user
            experience design, user interface development, software engineering
            and prototyping. He also enjoys playing soccer, bike touring, rock
            climbing, teaching mountaineering and traveling as much as possible.
          </p>
          <p>
            <Link to={config.siteGithubUrl}>
              <GitHub />
            </Link>
            <span style={{padding: '0.5rem'}} />
            <Link to={config.siteTwitterUrl}>
              <Twitter />
            </Link>
          </p>
        </div>
      </footer>
    )
  }
}
