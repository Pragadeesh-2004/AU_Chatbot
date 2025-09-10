"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import SearchInput from "./SearchInput";

interface EditFormField {
  key: string;
  label: string;
}

interface EditFormProps {
  fields: EditFormField[];
  values: { [key: string]: string };
  onValueChange: (key: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveText?: string;
  cancelText?: string;
}

const EditForm: React.FC<EditFormProps> = ({
  fields,
  values,
  onValueChange,
  onSave,
  onCancel,
  saveText = "Save",
  cancelText = "Cancel"
}) => {
  return (
    <div className="mb-4 flex flex-col items-start">
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex flex-col w-full">
            <span className="font-medium mb-1 text-left">{label}:</span>
            <SearchInput
              value={values[key] ?? ""}
              onChange={e => onValueChange(key, e.target.value)}
              className="w-full"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-6 w-full max-w-xs">
        <Button variant="default" size="sm" onClick={onSave}>
          {saveText}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          {cancelText}
        </Button>
      </div>
    </div>
  );
};

export default EditForm;