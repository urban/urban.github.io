import { MDXRemote } from "next-mdx-remote/rsc";

const CustomMDX = ({ source }: { source: string }) => {
  return <MDXRemote source={source} />;
};

export default CustomMDX;
