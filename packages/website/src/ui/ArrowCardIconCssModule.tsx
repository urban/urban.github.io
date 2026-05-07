import styles from "./ArrowCardIconCssModule.module.css"

const ArrowCardIconCssModule = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.icon}>
    <line x1="5" y1="12" x2="19" y2="12" className={styles.line} />
    <polyline points="12 5 19 12 12 19" className={styles.arrowHead} />
  </svg>
)

export { ArrowCardIconCssModule }
