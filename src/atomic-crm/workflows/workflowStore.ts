import type { Workflow } from "./types";

// Simple global store for workflows in MVP
// In production, this would be replaced with proper state management (Redux, Zustand, etc.)
class WorkflowStore {
  private workflows: Workflow[] = [];
  private listeners: Array<(workflows: Workflow[]) => void> = [];

  // Default workflows
  private defaultWorkflows: Workflow[] = [
    {
      id: "1",
      name: "Thank You After Win",
      description: "Automatically create a thank you task when a deal is won",
      trigger: {
        type: "deal_stage_changed",
        stage: "won",
      },
      action: {
        type: "create_task",
        taskType: "Thank you",
        taskText: "Send thank you message to customer",
        dueDateOffset: 1,
      },
      enabled: true,
      created_at: new Date().toISOString(),
      sales_id: 1,
    },
  ];

  constructor() {
    this.workflows = [...this.defaultWorkflows];
  }

  getWorkflows(): Workflow[] {
    return [...this.workflows];
  }

  addWorkflow(workflow: Workflow) {
    this.workflows.push(workflow);
    this.notifyListeners();
  }

  updateWorkflow(id: string, updates: Partial<Workflow>) {
    const index = this.workflows.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.workflows[index] = { ...this.workflows[index], ...updates };
      this.notifyListeners();
    }
  }

  deleteWorkflow(id: string) {
    this.workflows = this.workflows.filter((w) => w.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (workflows: Workflow[]) => void) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.workflows]));
  }
}

// Global instance
export const workflowStore = new WorkflowStore();
