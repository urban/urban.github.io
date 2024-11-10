const Promise = require("bluebird");
const path = require("path");
const { createFilePath } = require("gatsby-source-filesystem");

const prod = process.env.NODE_ENV === "production";

// Create slugs for files.
// // Slug will used for blog page path.
exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value
    });
  }
};

// Implement the Gatsby API `createPages`.
// This is called after the Gatsby bootstrap is finished
// so you have access to any information necessary to
// programatically create pages.
exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators;

  return new Promise((resolve, reject) => {
    const articleTemplate = path.resolve("./src/templates/article.tsx");
    const toArticles = toPages(articleTemplate);
    const workTemplate = path.resolve("./src/templates/work.tsx");
    const toWork = toPages(workTemplate);

    resolve(
      graphql(
        `
          {
            posts: allMarkdownRemark(
              sort: { fields: [frontmatter___date], order: DESC }
              limit: 1000
            ) {
              edges {
                node {
                  fields {
                    slug
                  }
                  frontmatter {
                    title
                    draft
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors);
          reject(result.errors);
        }

        const isDraft = x => x.frontmatter.draft;
        const filterDrafts = prod ? x => !isDraft(x) : x => x;
        const posts = result.data.posts.edges
          .map(x => x.node)
          .filter(filterDrafts);

        const articles = posts.filter(x =>
          x.fields.slug.startsWith("/article/")
        );
        toArticles(articles).forEach(x => createPage(x));

        const work = posts.filter(x => x.fields.slug.startsWith("/work/"));
        toWork(work).forEach(x => createPage(x));
      })
    );
  });
};

const toPages = template => xs =>
  xs.map((x, i) => ({
    path: x.fields.slug,
    component: template,
    context: {
      slug: x.fields.slug,
      previous: i === x.length - 1 ? false : xs[i + 1],
      next: i === 0 ? false : xs[i - 1]
    }
  }));
