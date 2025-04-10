import { H4 } from "../components/Typography";
import { SiteHeader } from "../components/SiteHeader";
import * as styles from './page.css';

export default async function Page() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <H4>Featured Work</H4>
        {/*
        <div className={styles.work}>
          {Object.values(articles).map(({ node }) => {
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
          })}
        </div>
        */}
      </main>
    </div>
  );
}
