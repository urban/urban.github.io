import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeShiki from "@shikijs/rehype";
import rehypeCallouts from 'rehype-callouts'
import { H4, H6, Paragraph } from "./Typography";

const components = {
  p: Paragraph,
  h4: H4,
  h6: H6
}

const CustomMDX = ({ source }: { source: string }) => {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          // Plugins 👈
          rehypePlugins: [
            [
              rehypeShiki,
              {
                themes: {
                  // use surface inverse colors for code blocks
                  light: "github-dark-default",
                  dark: "github-light-default",
                },
              },
            ],
            rehypeCallouts
          ],
        },
      }}
    />
  );
};

export default CustomMDX;
