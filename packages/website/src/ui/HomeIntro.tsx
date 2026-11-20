import { Heading } from "./Heading"
import { Text } from "./Text"

const HomeIntro = () => (
  <section className="home-intro" aria-labelledby="intro-title">
    {/*<Text variant="eyebrow">Engineering + Design + developer tools</Text>*/}
    <Heading level={1} variant="display" id="intro-title">
      I’m Urban.
      <br />I build software,
      <br />
      platforms, systems,
      <br />
      and <em>tools for people.</em>
    </Heading>
    <Text variant="lede">Engineer, leader, designer, and systems thinker.</Text>
    <Text>
      These days, I’m designing and building custom software that helps businesses reduce manual
      work, connect existing tools, and apply AI where it creates real value.
    </Text>
  </section>
)

export { HomeIntro }
