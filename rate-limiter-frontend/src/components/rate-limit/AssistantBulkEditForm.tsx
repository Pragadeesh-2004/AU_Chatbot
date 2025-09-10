"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import SearchInput from "./SearchInput";

interface AssistantBulkEditFormProps {
  assistantEditValuesArray: any[];
  assistantsMap: { [key: string]: string };
  editedOrgKeys: string[];
  onValueChange: (idx: number, key: string, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}

const AssistantBulkEditForm: React.FC<AssistantBulkEditFormProps> = ({
  assistantEditValuesArray,
  assistantsMap,
  editedOrgKeys,
  onValueChange,
  onSave,
  onBack
}) => {
  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">Edit Assistant Dependent Keys</h2>
      <div className="space-y-6">
        {assistantEditValuesArray.map((a, idx) => (
          <div key={a.assistant_id} className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium text-lg mb-3">{assistantsMap[a.assistant_id] || a.assistant_id}</h3>
            <div className="grid grid-cols-2 gap-4">
              {editedOrgKeys.includes("max_input_token") && (
                <>
                  <div className="flex flex-col">
                    <span className="font-medium mb-1">Input Token/User:</span>
                    <SearchInput 
                      value={a.input_token_per_user} 
                      onChange={e => onValueChange(idx, "input_token_per_user", e.target.value)}
                      placeholder="Input Token/User" 
                      className="w-full" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium mb-1">Input Token/Assistant:</span>
                    <SearchInput 
                      value={a.input_token_per_assistant} 
                      onChange={e => onValueChange(idx, "input_token_per_assistant", e.target.value)}
                      placeholder="Input Token/Assistant" 
                      className="w-full" 
                    />
                  </div>
                </>
              )}
              {editedOrgKeys.includes("max_output_token") && (
                <>
                  <div className="flex flex-col">
                    <span className="font-medium mb-1">Output Token/User:</span>
                    <SearchInput 
                      value={a.output_token_per_user} 
                      onChange={e => onValueChange(idx, "output_token_per_user", e.target.value)}
                      placeholder="Output Token/User" 
                      className="w-full" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium mb-1">Output Token/Assistant:</span>
                    <SearchInput 
                      value={a.output_token_per_assistant} 
                      onChange={e => onValueChange(idx, "output_token_per_assistant", e.target.value)}
                      placeholder="Output Token/Assistant" 
                      className="w-full" 
                    />
                  </div>
                </>
              )}
              {editedOrgKeys.includes("file_count") && (
                <div className="flex flex-col">
                  <span className="font-medium mb-1">File Count:</span>
                  <SearchInput 
                    value={a.file_count} 
                    onChange={e => onValueChange(idx, "file_count", e.target.value)}
                    placeholder="File Count" 
                    className="w-full" 
                  />
                </div>
              )}
              {editedOrgKeys.includes("file_size") && (
                <div className="flex flex-col">
                  <span className="font-medium mb-1">File Size:</span>
                  <SearchInput 
                    value={a.file_size} 
                    onChange={e => onValueChange(idx, "file_size", e.target.value)}
                    placeholder="File Size" 
                    className="w-full" 
                  />
                </div>
              )}
              {editedOrgKeys.includes("knowledge_base_index_size") && (
                <div className="flex flex-col">
                  <span className="font-medium mb-1">KB Index Size:</span>
                  <SearchInput 
                    value={a.knowledge_base_index_size} 
                    onChange={e => onValueChange(idx, "knowledge_base_index_size", e.target.value)}
                    placeholder="KB Index Size" 
                    className="w-full" 
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 mt-6">
        <Button variant="default" onClick={onSave}>
          Save
        </Button>
        <Button variant="default" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default AssistantBulkEditForm;