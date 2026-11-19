import { SITE, SOCIALS } from "../lib/consts"
import { Container } from "./Container"
import { Heading } from "./Heading"
import { Link } from "./NavLink"
import { Text } from "./Text"

const socialLabels = { github: "GitHub", linkedin: "LinkedIn", "twitter-x": "X" }

const ContactSection = () => (
  <section className="contact-section" aria-labelledby="contact-title">
    <Container>
      <div className="contact-content">
        <Heading level={2} variant="section" id="contact-title">
          Let’s connect.
        </Heading>
        <div>
          <Text>
            If you want to get in touch about something or just say hi, reach out on social media or
            send me an email.
          </Text>
          <ul className="contact-links" aria-label="Contact and social links">
            <li>
              <Link href={`mailto:${SITE.email}`} showExternalIcon>
                Email me
              </Link>
            </li>
            {SOCIALS.map(({ name, href }) => (
              <li key={name}>
                <Link href={href}>{socialLabels[name]}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  </section>
)

export { ContactSection }
