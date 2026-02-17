import { useListContext } from "ra-core";
import { Link as RouterLink } from "react-router";
import { Badge } from "@/components/ui/badge";

export const UnitList = () => {
  const { data, error, isPending } = useListContext();
  if (isPending || error) return <div className="h-8" />;
  return (
    <div className="flex flex-row flex-wrap gap-2 mt-2">
      {data.map((unit) => (
        <RouterLink
          key={unit.id}
          to={`/property_units/${unit.id}/show`}
          className="hover:opacity-80"
        >
          <Badge variant="outline" className="font-mono">
            {unit.code}
          </Badge>
        </RouterLink>
      ))}
    </div>
  );
};
