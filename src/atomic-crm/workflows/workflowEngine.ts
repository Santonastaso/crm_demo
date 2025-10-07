import type { DataProvider } from "ra-core";
import type { Workflow, Deal, Task } from "../types";

// Simple workflow engine for MVP
export class WorkflowEngine {
  private dataProvider: DataProvider;
  private workflows: Workflow[] = [];

  constructor(dataProvider: DataProvider, workflows: Workflow[] = []) {
    this.dataProvider = dataProvider;
    this.workflows = workflows.length > 0 ? workflows : this.getDefaultWorkflows();
  }

  private getDefaultWorkflows(): Workflow[] {
    // Default workflows for MVP
    return [
      {
        id: "1",
        name: "Thank You After Win",
        description: "Automatically create a thank you task when a deal is won",
        trigger: {
          type: "deal_stage_changed",
          stage: "won"
        },
        action: {
          type: "create_task",
          taskType: "Thank you",
          taskText: "Send thank you message to customer",
          dueDateOffset: 1
        },
        enabled: true,
        created_at: new Date().toISOString(),
        sales_id: 1
      }
    ];
  }

  // Method to update workflows (for when user creates new ones)
  updateWorkflows(workflows: Workflow[]) {
    this.workflows = workflows;
  }

  async executeWorkflows(deal: Deal, previousDeal?: Deal) {
    // Only execute if deal stage changed
    if (!previousDeal || deal.stage === previousDeal.stage) {
      return;
    }

    // Find matching workflows
    const matchingWorkflows = this.workflows.filter(workflow => 
      workflow.enabled &&
      workflow.trigger.type === "deal_stage_changed" &&
      workflow.trigger.stage === deal.stage
    );

    // Execute each matching workflow
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
      return; // No contacts to create tasks for
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + workflow.action.dueDateOffset);

    // Create a task for each contact in the deal
    for (const contactId of deal.contact_ids) {
      try {
        await this.dataProvider.create("tasks", {
          data: {
            contact_id: contactId,
            type: workflow.action.taskType,
            text: workflow.action.taskText,
            due_date: dueDate.toISOString(),
            sales_id: deal.sales_id
          }
        });
      } catch (error) {
        console.error("Failed to create task from workflow:", error);
      }
    }
  }
}
