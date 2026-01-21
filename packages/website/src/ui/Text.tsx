import React from "react";
import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  variant: "label" | "muted";
  as?: React.ElementType;
};

const Text = ({ as = "p", children, variant }: Props) => {
  const Tag = as;

  const variantClasses = {
    label: "font-semibold text-black dark:text-white",
    muted: "text-sm opacity-75",
  };

  const combinedClasses = clsx(variantClasses[variant]);

  return <Tag className={combinedClasses}>{children}</Tag>;
};

export { Text };
