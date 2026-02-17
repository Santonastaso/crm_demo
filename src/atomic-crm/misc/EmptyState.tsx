import type { ReactNode } from "react";
import useAppBarHeight from "./useAppBarHeight";

interface EmptyStateProps {
  title: string;
  message: string;
  actions: ReactNode;
}

export const EmptyState = ({ title, message, actions }: EmptyStateProps) => {
  const appbarHeight = useAppBarHeight();
  return (
    <div
      className="flex flex-col justify-center items-center gap-6"
      style={{ height: `calc(100dvh - ${appbarHeight}px)` }}
    >
      <img src="./img/empty.svg" alt={title} />
      <div className="flex flex-col gap-0 items-center">
        <h6 className="text-lg font-bold">{title}</h6>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {message}
        </p>
      </div>
      <div className="flex flex-row gap-2">{actions}</div>
    </div>
  );
};
