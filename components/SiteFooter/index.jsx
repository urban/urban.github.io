// @flow
import React from 'react'
// $FlowFixMe
import {config} from 'config'
import moment from 'moment'

import './SiteFooter.css'

export default class SiteFooter extends React.Component {
  render() {
    return (
      <footer className="site-footer">
        <div>
          <span>
            &copy; {config.siteAuthor} 2013&mdash;{moment().format('YYYY')}
          </span>
        </div>
      </footer>
    )
  }
}
