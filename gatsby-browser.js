import ReactGA from "react-ga"
import {siteMetadata} from "./gatsby-config"

ReactGA.initialize(siteMetadata.googleAnalyticsId)

exports.onRouteUpdate = (state, page, pages) => {
  ReactGA.pageview(state.pathname)
}
