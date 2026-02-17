import type { Identifier, RaRecord } from "ra-core";

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
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  action: WorkflowAction;
  enabled: boolean;
  created_at: string;
  sales_id: Identifier;
} & Pick<RaRecord, "id">;
