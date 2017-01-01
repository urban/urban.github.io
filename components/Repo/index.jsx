// @flow
import React from 'react'
import { Link } from 'react-router'
import styles from './styles.module.css'

const nbsp = '\u00a0'

export default class Repo extends React.Component {
  render () {
    const { name, html_url, description, language } = this.props
    return (
      <section className={styles.root}>
        <a style={{ borderBottom: 'none' }} href={html_url} target='_blank'>
          <header className={styles.header}>
            <h4 className={styles.title}>
              { name }
              <small className={styles.subtitle}>{ language || nbsp }</small>
            </h4>
          </header>
          <main className={styles.content}>{ description }</main>
        </a>
      </section>
    )
  }
}
