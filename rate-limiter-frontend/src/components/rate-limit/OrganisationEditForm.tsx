"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, X } from "lucide-react";
import { z } from "zod";

// ===== TYPES & SCHEMAS =====

interface OrganisationEditFormProps {
  orgData: any;
  orgId: string;
  orgName: string;
  onSave: (updatedData: any) => void;
  onCancel: () => void;
}

interface FormValues {
  max_input_token: string;
  max_output_token: string;
  file_count: string;
  file_size: string;
  knowledge_base_count: string;
  knowledge_base_index_size: string;
  active_assistant_count: string;
}

interface FormField {
  key: keyof FormValues;
  label: string;
  description: string;
}

const organisationSchema = z.object({
  max_input_token: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) >= 0, { 
    message: "Must be a non-negative number" 
  }),
  max_output_token: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) >= 0, { 
    message: "Must be a non-negative number" 
  }),
  file_count: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) >= 0, { 
    message: "Must be a non-negative number" 
  }),
  file_size: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) >= 0, { 
    message: "Must be a non-negative number" 
  }),
  knowledge_base_count: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) >= 0, { 
    message: "Must be a non-negative number" 
  }),
  knowledge_base_index_size: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) >= 0, { 
    message: "Must be a non-negative number" 
  }),
  active_assistant_count: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) >= 0, { 
    message: "Must be a non-negative number" 
  }),
});

// ===== CONSTANTS =====

const fields: FormField[] = [
  { key: "max_input_token", label: "Max Input Token", description: "Maximum input tokens allowed" },
  { key: "max_output_token", label: "Max Output Token", description: "Maximum output tokens allowed" },
  { key: "file_count", label: "File Count", description: "Maximum number of files" },
  { key: "file_size", label: "File Size", description: "Maximum file size (MB)" },
  { key: "knowledge_base_count", label: "Knowledge Base Count", description: "Maximum knowledge bases" },
  { key: "knowledge_base_index_size", label: "Knowledge Base Index Size", description: "Maximum index size" },
  { key: "active_assistant_count", label: "Active Assistant Count", description: "Maximum active assistants" },
];

const RATE_LIMIT_ORG_API = "http://localhost:3000/rate-limit/organisation";

// ===== MAIN COMPONENT =====

const OrganisationEditForm: React.FC<OrganisationEditFormProps> = ({
  orgData,
  orgId,
  orgName,
  onSave,
  onCancel
}) => {
  // ===== STATE =====
  
  const [values, setValues] = useState<FormValues>({
    max_input_token: "",
    max_output_token: "",
    file_count: "",
    file_size: "",
    knowledge_base_count: "",
    knowledge_base_index_size: "",
    active_assistant_count: "",
  });
  
  const [originalValues, setOriginalValues] = useState<FormValues>({
    max_input_token: "",
    max_output_token: "",
    file_count: "",
    file_size: "",
    knowledge_base_count: "",
    knowledge_base_index_size: "",
    active_assistant_count: "",
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValid, setIsValid] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // ===== EFFECTS =====

  useEffect(() => {
    const initial: FormValues = {
      max_input_token: String(orgData?.max_input_token ?? "0"),
      max_output_token: String(orgData?.max_output_token ?? "0"),
      file_count: String(orgData?.file_count ?? "0"),
      file_size: String(orgData?.file_size ?? "0"),
      knowledge_base_count: String(orgData?.knowledge_base_count ?? "0"),
      knowledge_base_index_size: String(orgData?.knowledge_base_index_size ?? "0"),
      active_assistant_count: String(orgData?.active_assistant_count ?? "0"),
    };
    
    setValues(initial);
    setOriginalValues(initial);
  }, [orgData]);

  useEffect(() => {
    // Check for changes
    const changed = fields.some(({ key }) => values[key] !== originalValues[key]);
    setHasChanges(changed);

    // Validate with Zod
    try {
      organisationSchema.parse(values);
      setErrors({});
      setIsValid(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        err.issues.forEach(e => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
      setIsValid(false);
    }
  }, [values, originalValues]);

  // ===== HANDLERS =====

  const handleChange = (key: keyof FormValues, value: string): void => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (): Promise<void> => {
    if (!hasChanges || !isValid) return;

    setLoading(true);
    
    try {
      const patchBody = Object.fromEntries(
        fields
          .filter(({ key }) => values[key] !== originalValues[key])
          .map(({ key }) => [key, Number(values[key])])
      );

      const res = await fetch(`${RATE_LIMIT_ORG_API}/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || "Failed to update organisation");
      }

      // Return updated data
      const updatedData = { ...orgData, ...patchBody };
      onSave(updatedData);
      
    } catch (err: any) {
      console.error("Failed to save:", err);
      // You might want to show an error message here
    } finally {
      setLoading(false);
    }
  };

  // ===== COMPUTED VALUES =====

  const isFormEnabled = hasChanges && isValid;

  // ===== RENDER FUNCTIONS =====

  const renderStatusIndicator = () => (
    <div className="mb-6">
      {hasChanges && (
        <div className="text-sm mb-2">
          {isValid ? (
            <span className="text-green-600 flex items-center">
              ✓ All changes are valid
            </span>
          ) : (
            <span className="text-red-600 flex items-center">
              ⚠ Please fix validation errors
            </span>
          )}
        </div>
      )}
      
      {!hasChanges && (
        <div className="text-sm text-gray-500 mb-2">
          Make changes to enable save button
        </div>
      )}
    </div>
  );

  const renderFormField = ({ key, label, description }: FormField) => (
    <div key={key} className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <Input
        type="number"
        value={values[key] || ""}
        onChange={e => handleChange(key, e.target.value)}
        className={`w-full ${errors[key] ? "border-red-500" : ""}`}
        placeholder={`Enter ${label.toLowerCase()}`}
        disabled={loading}
      />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {errors[key] && (
        <span className="text-red-500 text-xs">{errors[key]}</span>
      )}
      {values[key] !== originalValues[key] && (
        <span className="text-blue-500 text-xs">
          Changed from: {originalValues[key]}
        </span>
      )}
    </div>
  );

  const renderHeader = () => (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onCancel} disabled={loading}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Organisation</h1>
              <p className="text-gray-600">{orgName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || !isFormEnabled}
              className={!isFormEnabled ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Organisation Rate Limits</CardTitle>
          <p className="text-sm text-gray-600">
            Configure rate limits and quotas for your organisation
          </p>
        </CardHeader>
        <CardContent>
          {renderStatusIndicator()}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(renderFormField)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ===== MAIN RENDER =====

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

export default OrganisationEditForm;