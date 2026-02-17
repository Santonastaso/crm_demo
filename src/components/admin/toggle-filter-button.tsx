import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useListContext, useTranslate } from "ra-core";
import { CircleX } from "lucide-react";

export const ToggleFilterButton = ({
  label,
  size = "sm",
  value,
  className,
}: {
  label: React.ReactElement | string;
  value: any;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
}) => {
  const { filterValues, setFilters } = useListContext();
  const translate = useTranslate();
  const isSelected = getIsSelected(value, filterValues);
  const handleClick = () => setFilters(toggleFilter(value, filterValues));
  return (
    <Button
      variant={isSelected ? "secondary" : "ghost"}
      onClick={handleClick}
      className={cn(
        "cursor-pointer",
        "flex flex-row items-center gap-2 px-2.5",
        className,
      )}
      size={size}
    >
      {typeof label === "string" ? translate(label, { _: label }) : label}
      {isSelected && <CircleX className="opacity-50" />}
    </Button>
  );
};

const definedEntries = (obj: any) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => typeof v !== "undefined"));

const shallowMatches = (pattern: any, target: any) =>
  Object.keys(pattern).every((k) => target[k] === pattern[k]);

const toggleFilter = (value: any, filters: any) => {
  const isSelected = shallowMatches(definedEntries(value), filters);

  if (isSelected) {
    const keysToRemove = Object.keys(value);
    return Object.keys(filters).reduce(
      (acc, key) =>
        keysToRemove.includes(key) ? acc : { ...acc, [key]: filters[key] },
      {},
    );
  }

  return { ...filters, ...value };
};

const getIsSelected = (value: any, filters: any) =>
  shallowMatches(definedEntries(value), filters);
