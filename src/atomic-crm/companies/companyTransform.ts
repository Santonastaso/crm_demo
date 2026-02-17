export const companyTransform = (values: Record<string, any>) => {
  if (values.website && !values.website.startsWith("http")) {
    values.website = `https://${values.website}`;
  }
  return values;
};
