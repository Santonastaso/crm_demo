import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useGetList } from "ra-core";
import type { Project } from "../types";

interface ProjectContextValue {
  projects: Project[];
  selectedProjectId: number | null;
  selectedProject: Project | null;
  setSelectedProjectId: (id: number | null) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  selectedProjectId: null,
  selectedProject: null,
  setSelectedProjectId: () => {},
  isLoading: true,
});

export const useProjectContext = () => useContext(ProjectContext);

const STORAGE_KEY = "crm_selected_project";

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  const { data: projects = [], isLoading } = useGetList<Project>("projects", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const setSelectedProjectId = useCallback((id: number | null) => {
    setSelectedProjectIdState(id);
    if (id !== null) {
      localStorage.setItem(STORAGE_KEY, String(id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  useEffect(() => {
    if (!isLoading && projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(Number(projects[0].id));
    }
  }, [isLoading, projects, selectedProjectId, setSelectedProjectId]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
