import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { organisationSchema } from "./organisationSchema";
import { z } from "zod";

type OrganisationFormProps = {
  values: any;
  setValues: React.Dispatch<any>;
  editedKeys: string[];
  setEditedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  onNext: () => Promise<void>;
  onCancel: () => void;
  hasAssistants: boolean;
  loading: boolean;
  originalValues: any; 
};

const fields = [
  { key: "max_input_token", label: "Max Input Token" },
  { key: "max_output_token", label: "Max Output Token" },
  { key: "file_count", label: "File Count" },
  { key: "file_size", label: "File Size" },
  { key: "knowledge_base_count", label: "Knowledge Base Count" },
  { key: "knowledge_base_index_size", label: "Knowledge Base Index Size" },
  { key: "active_assistant_count", label: "Active Assistant Count" },
];

const OrganisationForm: React.FC<OrganisationFormProps> = ({
  values,
  setValues,
  setEditedKeys,
  onNext,
  onCancel,
  hasAssistants,
  loading,
  originalValues,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValid, setIsValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = fields.some(
      ({ key }) => values[key] !== String(originalValues[key] ?? "")
    );
    setHasChanges(changed);

    try {
      organisationSchema.parse(values);
      setErrors({});
      setIsValid(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        err.issues.forEach(e => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
      }
      setIsValid(false);
    }
  }, [values, originalValues]);

  const handleChange = (key: string, value: string) => {
    setValues((prev: any) => ({
      ...prev,
      [key]: value,
    }));

    setEditedKeys(prev => {
      const changed = value !== String(originalValues[key] ?? "");
      if (changed) {
        return prev.includes(key) ? prev : [...prev, key];
      } else {
        return prev.filter(k => k !== key);
      }
    });
  };

  return (
    <div className="mb-4 flex flex-col items-start">
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex flex-col w-full">
            <span className="font-medium mb-1 text-left">{label}:</span>
            <Input
              value={values[key] !== undefined && values[key] !== null ? String(values[key]) : ""}
              onChange={e => handleChange(key, e.target.value)}
              className={`w-full ${errors[key] ? "border-red-500" : ""}`}
            />
            {errors[key] && (
              <span className="text-red-500 text-xs mt-1">{errors[key]}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-6 w-full max-w-xs">
        <Button
          variant="default"
          size="sm"
          onClick={onNext}
          disabled={loading || !isValid || !hasChanges}
        >
          {hasAssistants ? "Next" : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default OrganisationForm;