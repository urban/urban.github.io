import styles from "./page.module.css";
import SiteHeader from "../components/SiteHeader";

export default function Home() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h4 className={styles.h4}>Featured Work</h4>
        <div className={styles.work}>
          {/* {Object.values(articles).map(({ node }) => {
            const props = {
              client: node.frontmatter.client,
              color: node.frontmatter.color,
              image: node.frontmatter.listingImage,
              slug: node.fields.slug,
              title: path(["frontmatter", "title"], node) || node.fields.slug
            };
            return (
              props.slug
              <div className={styles.work-item} key={props.slug}>
                <WorkListing {...props} />
              </div>
            );
          })} */}
        </div>
      </main>
    </div>
  );
}
