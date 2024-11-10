import type { Article as Schema } from "../services/schema";
import styles from "../app/page.module.css";

const Article = ({ article }: { article: Schema }) => {
  return (
    <>
      <h4 className={styles.h4}>{article.frontmatter.title}</h4>
      <div className={styles.work}></div>
    </>
  );
};

export default Article;
