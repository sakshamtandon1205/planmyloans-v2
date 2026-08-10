import type { MDXProps } from "mdx/types";
import type { GuideFrontmatter } from "@/lib/guides";

declare module "*.mdx" {
  export const frontmatter: GuideFrontmatter;
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
