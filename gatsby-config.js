module.exports = {
  siteMetadata: {
    title: "Urban Faubion / Design Technologist",
    author: "Urban Faubion"
  },
  plugins: [
    // Expose `/data` to graphQL layer
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/data`,
        name: "pages"
      }
    },

    // Parse all markdown files (each plugin add/parse some data into graphQL layer)
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-external-links",
            options: {
              target: "_blank",
              rel: null
            }
          },
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 888
            }
          },
          {
            resolve: "gatsby-remark-responsive-iframe",
            options: {
              wrapperStyle: "margin-bottom: 1.0725rem"
            }
          },
          "gatsby-remark-prismjs",
          "gatsby-remark-copy-linked-files",
          "gatsby-remark-smartypants"
        ]
      }
    },

    // Parse all image files
    "gatsby-transformer-sharp",
    "gatsby-plugin-sharp",

    // Parse JSON files
    "gatsby-transformer-json",

    // CSS-in-JS
    "gatsby-plugin-styled-components",

    // Add typescrpt stack into webpack
    "gatsby-plugin-typescript",

    // Easily add Google Analytics to your Gatsby site.
    {
      resolve: "gatsby-plugin-google-analytics",
      options: {
        //trackingId: `ADD YOUR TRACKING ID HERE`,
      }
    },

    // This plugin generates a service worker and AppShell html file so the site works offline and is otherwise resistant to bad networks. Works with almost any site!
    "gatsby-plugin-offline",

    // Provides drop-in support for server rendering data added with React Helment.
    "gatsby-plugin-react-helmet"
  ]
};
