import styles from "../../page.module.css";
import SiteHeader from "../../../components/SiteHeader";

export default async function Page({ params: { slug }}: { params: { slug: string }; }) {
  console.log('/articles/[slug]');

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h4 className={styles.h4}>{slug}</h4>
        <div className={styles.work}>
        </div>
      </main>
    </div>
  );
}
