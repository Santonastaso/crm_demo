import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectContext } from "./ProjectContext";

export const ProjectSelector = () => {
  const { projects, selectedProjectId, setSelectedProjectId, isLoading } =
    useProjectContext();

  if (isLoading || projects.length === 0) return null;

  return (
    <Select
      value={selectedProjectId !== null ? String(selectedProjectId) : undefined}
      onValueChange={(val) => {
        if (val === "all") {
          setSelectedProjectId(null);
        } else {
          setSelectedProjectId(Number(val));
        }
      }}
    >
      <SelectTrigger className="w-[200px] h-8">
        <SelectValue placeholder="Select project" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Projects</SelectItem>
        {projects.map((project) => (
          <SelectItem key={String(project.id)} value={String(project.id)}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
