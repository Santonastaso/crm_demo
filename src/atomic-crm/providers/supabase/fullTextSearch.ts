import type { GetListParams } from "ra-core";

export const applyFullTextSearch = (columns: string[]) => (params: GetListParams) => {
  if (!params.filter?.q) {
    return params;
  }
  const { q, ...filter } = params.filter;
  return {
    ...params,
    filter: {
      ...filter,
      "@or": columns.reduce(
        (acc, column) => {
          if (column === "email")
            return { ...acc, [`email_fts@ilike`]: q };
          if (column === "phone")
            return { ...acc, [`phone_fts@ilike`]: q };
          return { ...acc, [`${column}@ilike`]: q };
        },
        {} as Record<string, string>,
      ),
    },
  };
};
