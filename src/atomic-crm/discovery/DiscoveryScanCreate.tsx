import { CreateBase, Form, useGetOne, required } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import {
  CancelButton,
  SaveButton,
  FormToolbar,
  TextInput,
  NumberInput,
  SelectInput,
  ReferenceInput,
  AutocompleteArrayInput,
} from "@/components/admin";
import { useFormContext, useWatch } from "react-hook-form";
import { useEffect } from "react";

const SECTOR_CHOICES = [
  { id: "real_estate_agency", name: "Real Estate Agencies" },
  { id: "general_contractor", name: "General Contractors" },
  { id: "roofing_contractor", name: "Roofing Contractors" },
  { id: "electrician", name: "Electricians" },
  { id: "plumber", name: "Plumbers" },
  { id: "lawyer", name: "Law Firms" },
  { id: "accounting", name: "Accounting Firms" },
  { id: "insurance_agency", name: "Insurance Agencies" },
  { id: "bank", name: "Banks" },
  { id: "moving_company", name: "Moving Companies" },
  { id: "home_improvement_store", name: "Home Improvement Stores" },
  { id: "furniture_store", name: "Furniture Stores" },
  { id: "building_materials_store", name: "Building Materials" },
  { id: "interior_designer", name: "Interior Designers" },
  { id: "architect", name: "Architects" },
  { id: "hotel", name: "Hotels" },
  { id: "restaurant", name: "Restaurants" },
];

const ProjectLocationSync = () => {
  const projectId = useWatch({ name: "project_id" });
  const { setValue, getValues } = useFormContext();

  const { data: project } = useGetOne(
    "projects",
    { id: projectId },
    { enabled: !!projectId },
  );

  useEffect(() => {
    if (project?.location_lat && project?.location_lng) {
      const currentLat = getValues("center_lat");
      const currentLng = getValues("center_lng");
      if (!currentLat && !currentLng) {
        setValue("center_lat", String(project.location_lat));
        setValue("center_lng", String(project.location_lng));
      }
    }
  }, [project, setValue, getValues]);

  return null;
};

export const DiscoveryScanCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 max-w-lg mx-auto">
      <Form
        defaultValues={{
          radius_km: 10,
          target_sectors: [],
          scoring_criteria: {
            sector_weight: 30,
            size_weight: 25,
            proximity_weight: 25,
            activity_weight: 20,
          },
          status: "pending",
        }}
      >
        <ProjectLocationSync />
        <Card>
          <CardContent>
            <div className="space-y-4 w-full">
              <ReferenceInput source="project_id" reference="projects">
                <SelectInput
                  optionText="name"
                  label="Project"
                  validate={required()}
                  helperText="Selecting a project will auto-fill coordinates"
                />
              </ReferenceInput>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  source="center_lat"
                  label="Center Latitude"
                  validate={required()}
                  helperText={false}
                />
                <TextInput
                  source="center_lng"
                  label="Center Longitude"
                  validate={required()}
                  helperText={false}
                />
              </div>
              <NumberInput
                source="radius_km"
                label="Search Radius (km)"
                validate={required()}
                helperText={false}
              />
              <AutocompleteArrayInput
                source="target_sectors"
                choices={SECTOR_CHOICES}
                label="Target Sectors"
                helperText="Select one or more business types to search for"
              />
              <h3 className="text-sm font-medium mt-4">Scoring Weights</h3>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  source="scoring_criteria.sector_weight"
                  label="Sector Match"
                  helperText={false}
                />
                <NumberInput
                  source="scoring_criteria.size_weight"
                  label="Company Size"
                  helperText={false}
                />
                <NumberInput
                  source="scoring_criteria.proximity_weight"
                  label="Proximity"
                  helperText={false}
                />
                <NumberInput
                  source="scoring_criteria.activity_weight"
                  label="Activity"
                  helperText={false}
                />
              </div>
            </div>
            <FormToolbar>
              <div className="flex flex-row gap-2 justify-end">
                <CancelButton />
                <SaveButton label="Create Scan" />
              </div>
            </FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </div>
  </CreateBase>
);
