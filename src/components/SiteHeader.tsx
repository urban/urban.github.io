import * as React from 'react';
import styles from './SiteHeader.module.css';

type NavLink = {
  children: React.ReactNode;
  href: string;
}
const NavLink = (props: NavLink) => (
  <a {...props} className={[styles.link, styles.navLink].join(' ')} />
);

const SiteHeader = () => (
  <header>
    <div className={styles.container}>
      <a className={styles.logo} href="/">
        <span className={styles.title}>Urban Faubion</span>
        <span className={styles.subTitle}>Design Technologist</span>
      </a>
      <nav className={styles.nav}>
        <NavLink href="/">Work</NavLink>
        <NavLink href="/resume">Resume</NavLink>
        <NavLink href="/about">About</NavLink>
      </nav>
    </div>
  </header>
);

export default SiteHeader;
