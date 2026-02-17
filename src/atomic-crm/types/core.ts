import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";

export type SignUpData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type UserRole = "admin" | "manager" | "agent" | "read_only";

export type SalesFormData = {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  disabled: boolean;
};

export type Sale = {
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin.
   * DO NOT UPDATE this field directly, it should be updated by the backend.
   */
  email: string;
} & Pick<RaRecord, "id">;

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;

export interface DealStage {
  value: string;
  label: string;
}

export interface NoteStatus {
  value: string;
  label: string;
  color: string;
}

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}
