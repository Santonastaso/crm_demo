import { supabaseDataProvider } from "ra-supabase-core";
import type { DataProvider, GetListParams, Identifier } from "ra-core";
import { withLifecycleCallbacks } from "ra-core";
import type { Deal, Sale, SalesFormData, SignUpData } from "../../types";
import { getActivityLog } from "../commons/activity";
import { getIsInitialized } from "./authProvider";
import { supabase } from "./supabase";
import { WorkflowEngine } from "../../workflows/workflowEngine";
import { fetchEnabledWorkflows } from "../../workflows/workflowStore";
import { uploadToBucket } from "./uploadToBucket";
import { applyFullTextSearch } from "./fullTextSearch";
import { processCompanyLogo, processContactAvatar } from "./avatarProcessing";
import { syncUnitStatuses } from "./dealUnitSync";

if (import.meta.env.VITE_SUPABASE_URL === undefined) {
  throw new Error("Please set the VITE_SUPABASE_URL environment variable");
}
if (import.meta.env.VITE_SUPABASE_ANON_KEY === undefined) {
  throw new Error("Please set the VITE_SUPABASE_ANON_KEY environment variable");
}

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
  sortOrder: "asc,desc.nullslast" as any,
  primaryKeys: new Map([["segment_contacts", ["segment_id", "contact_id"]]]),
});

const dataProviderWithCustomMethods = {
  ...baseDataProvider,
  async getList(resource: string, params: GetListParams) {
    if (resource === "companies") {
      return baseDataProvider.getList("companies_summary", params);
    }
    if (resource === "contacts") {
      return baseDataProvider.getList("contacts_summary", params);
    }
    return baseDataProvider.getList(resource, params);
  },
  async getOne(resource: string, params: any) {
    if (resource === "companies") {
      return baseDataProvider.getOne("companies_summary", params);
    }
    if (resource === "contacts") {
      return baseDataProvider.getOne("contacts_summary", params);
    }
    return baseDataProvider.getOne(resource, params);
  },

  async signUp({ email, password, first_name, last_name }: SignUpData) {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name, last_name } },
    });

    if (!response.data?.user || response.error) {
      console.error("signUp.error", response.error);
      throw new Error("Failed to create account");
    }

    getIsInitialized._is_initialized_cache = true;
    return { id: response.data.user.id, email, password };
  },

  async salesCreate(body: SalesFormData) {
    const { data, error } = await supabase.functions.invoke<Sale>("users", {
      method: "POST",
      body,
    });
    if (!data || error) {
      console.error("salesCreate.error", error);
      throw new Error("Failed to create account manager");
    }
    return data;
  },

  async salesUpdate(id: Identifier, data: Partial<Omit<SalesFormData, "password">>) {
    const { email, first_name, last_name, role, avatar, disabled } = data;
    const { data: sale, error } = await supabase.functions.invoke<Sale>("users", {
      method: "PATCH",
      body: { sales_id: id, email, first_name, last_name, role, disabled, avatar },
    });
    if (!sale || error) {
      console.error("salesUpdate.error", error);
      throw new Error("Failed to update account manager");
    }
    return data;
  },

  async sendPasswordReset(id: Identifier) {
    const { data: passwordUpdated, error } =
      await supabase.functions.invoke<boolean>("send-password-reset", {
        method: "PATCH",
        body: { sales_id: id },
      });
    if (!passwordUpdated || error) {
      console.error("passwordUpdate.error", error);
      throw new Error("Failed to update password");
    }
    return passwordUpdated;
  },

  async unarchiveDeal(deal: Deal) {
    const { data: deals } = await baseDataProvider.getList<Deal>("deals", {
      filter: { stage: deal.stage },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "index", order: "ASC" },
    });

    const updatedDeals = deals.map((d, index) => ({
      ...d,
      index: d.id === deal.id ? 0 : index + 1,
      archived_at: d.id === deal.id ? null : d.archived_at,
    }));

    return await Promise.all(
      updatedDeals.map((updatedDeal) =>
        baseDataProvider.update("deals", {
          id: updatedDeal.id,
          data: updatedDeal,
          previousData: deals.find((d) => d.id === updatedDeal.id),
        }),
      ),
    );
  },

  async getActivityLog(companyId?: Identifier) {
    return getActivityLog(baseDataProvider, companyId);
  },

  async isInitialized() {
    return getIsInitialized();
  },
} satisfies DataProvider;

export type CrmDataProvider = typeof dataProviderWithCustomMethods;

export const dataProvider = withLifecycleCallbacks(
  dataProviderWithCustomMethods,
  [
    ...["contactNotes", "dealNotes", "dealInteractions"].map((resource) => ({
      resource,
      beforeSave: async (data: any) => {
        if (data.attachments) {
          for (const fi of data.attachments) {
            await uploadToBucket(fi);
          }
        }
        return data;
      },
    })),
    {
      resource: "sales",
      beforeSave: async (data: Sale) => {
        if (data.avatar) {
          await uploadToBucket(data.avatar);
        }
        return data;
      },
    },
    {
      resource: "contacts",
      beforeCreate: async (params) => processContactAvatar(params),
      beforeUpdate: async (params) => processContactAvatar(params),
      beforeGetList: async (params) =>
        applyFullTextSearch([
          "first_name", "last_name", "company_name", "title", "email", "phone", "background",
        ])(params),
    },
    {
      resource: "companies",
      beforeGetList: async (params) =>
        applyFullTextSearch(["name", "phone_number", "website", "zipcode", "city", "stateAbbr"])(params),
      beforeCreate: async (params) => {
        const createParams = await processCompanyLogo(params);
        return {
          ...createParams,
          data: { ...createParams.data, created_at: new Date().toISOString() },
        };
      },
      beforeUpdate: async (params) => processCompanyLogo(params),
    },
    {
      resource: "contacts_summary",
      beforeGetList: async (params) =>
        applyFullTextSearch(["first_name", "last_name"])(params),
    },
    {
      resource: "deals",
      beforeGetList: async (params) =>
        applyFullTextSearch(["name", "type", "description"])(params),
      beforeUpdate: async (params) => {
        const previousData = params.previousData as Deal | undefined;
        if (previousData && params.data.stage !== previousData.stage) {
          params.data.stage_entered_at = new Date().toISOString();
        }
        return params;
      },
      afterUpdate: async (data: Deal, params) => {
        await syncUnitStatuses(data, params.previousData as Deal | undefined, dataProviderWithCustomMethods);
        const workflows = await fetchEnabledWorkflows();
        const workflowEngine = new WorkflowEngine(dataProviderWithCustomMethods, workflows);
        await workflowEngine.executeWorkflows(data, params.previousData);
        return data;
      },
    },
    {
      resource: "campaigns",
      afterCreate: async (result) => {
        const campaign = result.data;
        if (campaign?.template_id) {
          const { data: template } = await baseDataProvider.getOne("templates", {
            id: campaign.template_id,
          });
          if (template) {
            await baseDataProvider.create("campaign_steps", {
              data: {
                campaign_id: campaign.id,
                step_order: 1,
                channel: template.channel ?? campaign.channel,
                template_content: { body: template.body ?? "", subject: template.subject ?? "" },
                delay_hours: 0,
              },
            });
          }
        }
        return result;
      },
    },
    {
      resource: "knowledge_documents",
      beforeCreate: async (params) => {
        const file = params.data.file;
        if (!file?.rawFile) return params;

        const rawFile: File = file.rawFile;
        const fileExt = rawFile.name.split(".").pop() ?? "txt";
        const fileName = `${params.data.project_id ?? "general"}/${Date.now()}_${rawFile.name}`;
        const { error: uploadError } = await supabase.storage.from("knowledge").upload(fileName, rawFile);
        if (uploadError) {
          console.error("Knowledge upload error:", uploadError);
          throw new Error("Failed to upload document to storage");
        }
        const { file: _removed, ...rest } = params.data;
        return { ...params, data: { ...rest, file_path: fileName, file_type: fileExt } };
      },
      afterCreate: async (result) => {
        if (result.data?.id) {
          supabase.functions
            .invoke("process-document", { method: "POST", body: { document_id: result.data.id } })
            .catch((err: unknown) => console.error("process-document invoke error:", err));
        }
        return result;
      },
    },
  ],
);
