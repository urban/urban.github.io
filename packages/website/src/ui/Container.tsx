import type { ReactNode } from "react";

const Container = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-screen-sm px-5">{children}</div>
);

export { Container };
