import type { DataProvider } from "ra-core";
import type { Workflow, Deal } from "../types";

export class WorkflowEngine {
  private dataProvider: DataProvider;
  private workflows: Workflow[];

  constructor(dataProvider: DataProvider, workflows: Workflow[]) {
    this.dataProvider = dataProvider;
    this.workflows = workflows;
  }

  async executeWorkflows(deal: Deal, previousDeal?: Deal) {
    if (!previousDeal || deal.stage === previousDeal.stage) {
      return;
    }

    const matchingWorkflows = this.workflows.filter(
      (workflow) =>
        workflow.enabled &&
        workflow.trigger.type === "deal_stage_changed" &&
        workflow.trigger.stage === deal.stage,
    );

    for (const workflow of matchingWorkflows) {
      await this.executeWorkflow(workflow, deal);
    }
  }

  private async executeWorkflow(workflow: Workflow, deal: Deal) {
    if (workflow.action.type === "create_task") {
      await this.createTaskFromWorkflow(workflow, deal);
    }
  }

  private async createTaskFromWorkflow(workflow: Workflow, deal: Deal) {
    if (!deal.contact_ids || deal.contact_ids.length === 0) {
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + workflow.action.dueDateOffset);

    for (const contactId of deal.contact_ids) {
      try {
        await this.dataProvider.create("tasks", {
          data: {
            contact_id: contactId,
            type: workflow.action.taskType,
            text: workflow.action.taskText,
            due_date: dueDate.toISOString(),
            sales_id: deal.sales_id,
          },
        });
      } catch (error) {
        console.error("Failed to create task from workflow:", error);
      }
    }
  }
}
