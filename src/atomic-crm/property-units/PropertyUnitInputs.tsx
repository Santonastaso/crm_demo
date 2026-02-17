import {
  TextInput,
  SelectInput,
  NumberInput,
  ReferenceInput,
  AutocompleteInput,
} from "@/components/admin";
import { required } from "ra-core";

const TYPOLOGY_CHOICES = [
  { id: "appartamento", name: "Appartamento" },
  { id: "attico", name: "Attico" },
  { id: "monolocale", name: "Monolocale" },
  { id: "bilocale", name: "Bilocale" },
  { id: "trilocale", name: "Trilocale" },
  { id: "quadrilocale", name: "Quadrilocale" },
  { id: "villa", name: "Villa" },
  { id: "ufficio", name: "Ufficio" },
  { id: "commerciale", name: "Commerciale" },
];

const ORIENTATION_CHOICES = [
  { id: "Nord", name: "Nord" },
  { id: "Sud", name: "Sud" },
  { id: "Est", name: "Est" },
  { id: "Ovest", name: "Ovest" },
  { id: "Nord-Est", name: "Nord-Est" },
  { id: "Nord-Ovest", name: "Nord-Ovest" },
  { id: "Sud-Est", name: "Sud-Est" },
  { id: "Sud-Ovest", name: "Sud-Ovest" },
];

const ENERGY_CLASS_CHOICES = [
  { id: "A4", name: "A4" },
  { id: "A3", name: "A3" },
  { id: "A2", name: "A2" },
  { id: "A1", name: "A1" },
  { id: "B", name: "B" },
  { id: "C", name: "C" },
  { id: "D", name: "D" },
  { id: "E", name: "E" },
  { id: "F", name: "F" },
  { id: "G", name: "G" },
];

const STATUS_CHOICES = [
  { id: "disponibile", name: "Disponibile" },
  { id: "proposta", name: "Proposta" },
  { id: "compromesso", name: "Compromesso" },
  { id: "rogito", name: "Rogito" },
];

export const PropertyUnitInputs = () => (
  <div className="space-y-4 w-full">
    <div className="grid grid-cols-2 gap-4">
      <ReferenceInput source="project_id" reference="projects">
        <AutocompleteInput
          optionText="name"
          validate={required()}
          helperText={false}
          label="Project"
        />
      </ReferenceInput>
      <TextInput source="code" validate={required()} helperText={false} label="Unit Code" />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <SelectInput
        source="typology"
        choices={TYPOLOGY_CHOICES}
        helperText={false}
      />
      <SelectInput
        source="status"
        choices={STATUS_CHOICES}
        defaultValue="disponibile"
        validate={required()}
        helperText={false}
      />
      <SelectInput
        source="energy_class"
        choices={ENERGY_CLASS_CHOICES}
        helperText={false}
        label="Energy Class"
      />
    </div>

    <div className="grid grid-cols-4 gap-4">
      <NumberInput source="floor" helperText={false} label="Floor" />
      <SelectInput
        source="orientation"
        choices={ORIENTATION_CHOICES}
        helperText={false}
      />
      <NumberInput source="square_meters" helperText={false} label="SQM" />
      <NumberInput source="rooms" helperText={false} />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <NumberInput source="bathrooms" helperText={false} />
      <NumberInput source="base_price" helperText={false} label="Base Price (€)" />
      <NumberInput source="current_price" helperText={false} label="Current Price (€)" />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <NumberInput source="discount_pct" helperText={false} label="Discount %" />
    </div>

    <TextInput source="description" multiline helperText={false} />
  </div>
);
