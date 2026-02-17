import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { Workflow } from "./types";
import { defaultDealStages } from "../root/defaultConfiguration";

type WorkflowCreateDialogProps = {
  onCreateWorkflow: (
    workflow: Omit<Workflow, "id" | "created_at" | "sales_id">,
  ) => void;
};

export const WorkflowCreateDialog = ({
  onCreateWorkflow,
}: WorkflowCreateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerStage: "rogito",
    taskType: "Thank you",
    taskText: "Send thank you message to customer",
    dueDateOffset: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newWorkflow = {
      name: formData.name,
      description: formData.description,
      trigger: {
        type: "deal_stage_changed" as const,
        stage: formData.triggerStage,
      },
      action: {
        type: "create_task" as const,
        taskType: formData.taskType,
        taskText: formData.taskText,
        dueDateOffset: formData.dueDateOffset,
      },
      enabled: true,
    };

    onCreateWorkflow(newWorkflow);
    setOpen(false);
    setFormData({
      name: "",
      description: "",
      triggerStage: "rogito",
      taskType: "Thank you",
      taskText: "Send thank you message to customer",
      dueDateOffset: 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          {/* Provide description for accessibility to satisfy aria-describedby */}
          <DialogDescription>
            Name your workflow and configure its behavior.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Thank You After Win"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what this workflow does"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>When</Label>
            <div className="text-sm text-muted-foreground">
              Deal stage changes to:
            </div>
            <Select
              value={formData.triggerStage}
              onValueChange={(value) =>
                setFormData({ ...formData, triggerStage: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultDealStages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Then</Label>
            <div className="text-sm text-muted-foreground">Create a task:</div>
            <Select
              value={formData.taskType}
              onValueChange={(value) =>
                setFormData({ ...formData, taskType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Thank you">Thank you</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Meeting">Meeting</SelectItem>
                <SelectItem value="Demo">Demo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskText">Task Description</Label>
            <Input
              id="taskText"
              value={formData.taskText}
              onChange={(e) =>
                setFormData({ ...formData, taskText: e.target.value })
              }
              placeholder="What should the task say?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDateOffset">Due in (days)</Label>
            <Input
              id="dueDateOffset"
              type="number"
              min="0"
              value={formData.dueDateOffset}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dueDateOffset: parseInt(e.target.value) || 0,
                })
              }
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Workflow</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
