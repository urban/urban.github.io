// @flow
import React from 'react'
// $FlowFixMe
import { config } from 'config'
import { Link } from 'react-router'
import { GitHub, Twitter } from 'components/Icons'

import styles from './styles.module.css'

export default class PostFooter extends React.Component {
  render () {
    return (
      <footer className={styles.root}>
        {/* <Link to={prefixLink('/about')}> */}
        <div className={styles.avatar} />
        {/* </Link> */}
        <div>
          <h4 className={styles.heading}>Urban Faubion</h4>
          <p>Urban is a designer and developer with a love for creating digital products and services. He has a broad range of professional expertise in design, design research, interaction and user experience design, user interface development, software engineering and prototyping. He also enjoys playing soccer, bike touring, rock climbing, teaching mountaineering and traveling as much as possible.</p>
          <p>
            <Link to={config.siteGithubUrl}><GitHub /></Link>
            <span style={{ padding: '0.5rem' }} />
            <Link to={config.siteTwitterUrl}><Twitter /></Link>
          </p>
        </div>
      </footer>
    )
  }
}
