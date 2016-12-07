// @flow
import React from 'react'
import { Link } from 'react-router'
import moment from 'moment'
import { prefixLink } from 'gatsby-helpers'
import styles from './styles.module.css'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

export default class PostExcerpt extends React.Component {
  render () {
    const {
      path,
      title,
      description,
      datePublished,
      category
    } = this.props

    return (
      <div className={styles.root}>
        <header>
          <h2>
            <Link style={{ borderBottom: 'none' }} to={prefixLink(path)} > { title } </Link>
            <small>
              Posted at {' '}
              <time dateTime={moment(datePublished).format('MMMM D, YYYY')}>
                { moment(datePublished).format('MMMM YYYY') }
              </time>
              {' '} in { category }
            </small>
          </h2>
        </header>
        <p dangerouslySetInnerHTML={{ __html: md.render(description) }} />
        {/* <Link className={styles.readmore} to={prefixLink(path)}> Read</Link> */}
      </div>
    )
  }
}

PostExcerpt.propTypes = {
  path: React.PropTypes.string,
  title: React.PropTypes.string,
  description: React.PropTypes.string,
  datePublished: React.PropTypes.string,
  category: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.arrayOf(React.PropTypes.string)
  ])
}
