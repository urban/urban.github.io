// @flow
import React from 'react'
import SiteHeader from 'components/SiteHeader'
import SiteFooter from 'components/SiteFooter'

import '../static/css/reset.css'
import '../static/css/base.css'
import '../static/css/gist.css'
import '../static/css/highlight.css'

const styles = {
  root: {
    borderTop: '5px solid rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100vh',
  },
  main: {
    flex: '1 0 auto',
    position: 'relative',
    padding: '0 1rem',
    marginRight: 'auto',
    marginLeft: 'auto',
    padding: '0 1.25rem',
    maxWidth: 'calc(960px - (1.25rem * 2))',
    width: '100%',
  },
}

export default class Template extends React.Component {
  render() {
    return (
      <div style={styles.root}>
        <SiteHeader {...this.props} />
        <main style={styles.main}>{this.props.children}</main>
        <SiteFooter {...this.props} />
      </div>
    )
  }
}
