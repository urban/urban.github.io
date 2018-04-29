const Promise = require("bluebird");
const path = require("path");
const { createFilePath } = require("gatsby-source-filesystem");

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

        const articles = result.data.posts.edges
          .map(x => x.node)
          .filter(x => x.fields.slug.startsWith("/articles/"));

        toArticles(articles).forEach(x => createPage(x));
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
