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
    const { path, title, description, date, category } = this.props

    return (
      <article>
        <header>
          <h2 className={styles.title}>
            <Link style={{ borderBottom: 'none' }} to={prefixLink(path)}>
              { title }
            </Link>
            <small className={styles.subtitle}>
              Posted at { ' ' }
              <time dateTime={moment(date).format('MMMM D, YYYY')}>
                { moment(date).format('MMMM YYYY') }
              </time>
              { ' ' } in { category }
            </small>
          </h2>
        </header>
        <main dangerouslySetInnerHTML={{ __html: md.render(description) }} />
        {/* <Link className={styles.readmore} to={prefixLink(path)}> Read</Link> */}
      </article>
    )
  }
}

PostExcerpt.propTypes = {
  path: React.PropTypes.string,
  title: React.PropTypes.string,
  description: React.PropTypes.string,
  date: React.PropTypes.string,
  category: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.arrayOf(React.PropTypes.string)
  ])
}
