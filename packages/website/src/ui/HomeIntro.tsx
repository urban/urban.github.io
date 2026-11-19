import { Heading } from "./Heading"
import { Text } from "./Text"

const HomeIntro = () => (
  <section className="home-intro" aria-labelledby="intro-title">
    <Text variant="eyebrow">Design + engineering + developer tools</Text>
    <Heading level={1} variant="display" id="intro-title">
      I’m Urban.
      <br />I build software,
      <br />
      design systems,
      <br />
      and <em>tools for people.</em>
    </Heading>
    <Text variant="lede">Connecting design and engineering to make developers’ lives easier.</Text>
    <Text>
      I’ve spent my career building platforms and leading teams. These days, I’m exploring how AI
      can improve the way we build software.
    </Text>
  </section>
)

export { HomeIntro }
