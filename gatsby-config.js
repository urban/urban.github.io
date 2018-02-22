// @flow

module.exports = {
  siteMetadata: {
    title: "Urban Faubion",
    author: "Urban Faubion",
    twitterUrl: "https://twitter.com/urbanfaubion",
    githubUrl: "https://github.com/urban",
    emailUrl: "urban@urbanfaubion.com",
    googleAnalyticsId: "UA-88688732-1",
    linkPrefix: "",
  },
  plugins: [
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: `${__dirname}/src/pages/`,
      },
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 690,
            },
          },
          {
            resolve: "gatsby-remark-responsive-iframe",
          },
          "gatsby-remark-prismjs",
          "gatsby-remark-copy-linked-files",
          "gatsby-remark-smartypants",
        ],
      },
    },
    "gatsby-plugin-sharp",
  ],
}
