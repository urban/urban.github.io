import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeShiki from "@shikijs/rehype";
import rehypeCallouts from 'rehype-callouts'

const CustomMDX = ({ source }: { source: string }) => {
  return (
    <MDXRemote
      source={source}
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
