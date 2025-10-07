export type WorkflowTrigger = {
  type: "deal_stage_changed";
  stage: string;
};

export type WorkflowAction = {
  type: "create_task";
  taskType: string;
  taskText: string;
  dueDateOffset: number; // days from now
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  action: WorkflowAction;
  enabled: boolean;
  created_at: string;
  sales_id: number;
};
