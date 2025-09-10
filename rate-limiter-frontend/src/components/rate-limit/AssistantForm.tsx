import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AssistantEditValue = {
  assistant_id: string;
  input_token_per_user?: string;
  input_token_per_assistant?: string;
  output_token_per_user?: string;
  output_token_per_assistant?: string;
  file_count?: string;
  file_size?: string;
  knowledge_base_index_size?: string;
};

export interface AssistantFormProps {
  assistantEditValuesArray: any[];
  setAssistantEditValuesArray: React.Dispatch<React.SetStateAction<any[]>>;
  assistantsMap: { [key: string]: string };
  editedOrgKeys: string[];
  onSave: () => void | Promise<void>;
  onBack: () => void;
  loading: boolean;
}
const AssistantForm: React.FC<AssistantFormProps> = ({
  assistantEditValuesArray,
  setAssistantEditValuesArray,
  editedOrgKeys,
  assistantsMap,
  onSave,
  onBack,
}) => (
  <div>
    <h2 className="font-semibold text-lg mb-2">Edit Assistant Dependent Keys</h2>
    {assistantEditValuesArray.map((a, idx) => (
      <div key={a.assistant_id} className="mb-4 border-b pb-2">
        <b className="block mb-2">{assistantsMap[a.assistant_id] || a.assistant_id}</b>
        <div className="grid grid-cols-2 gap-4">
          {editedOrgKeys.includes("max_input_token") && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[160px]">Input Token/User:</span>
                <Input value={a.input_token_per_user} onChange={e => {
                  const arr = [...assistantEditValuesArray];
                  arr[idx].input_token_per_user = e.target.value;
                  setAssistantEditValuesArray(arr);
                }} placeholder="Input Token/User" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[160px]">Input Token/Assistant:</span>
                <Input value={a.input_token_per_assistant} onChange={e => {
                  const arr = [...assistantEditValuesArray];
                  arr[idx].input_token_per_assistant = e.target.value;
                  setAssistantEditValuesArray(arr);
                }} placeholder="Input Token/Assistant" />
              </div>
            </>
          )}
          {editedOrgKeys.includes("max_output_token") && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[160px]">Output Token/User:</span>
                <Input value={a.output_token_per_user} onChange={e => {
                  const arr = [...assistantEditValuesArray];
                  arr[idx].output_token_per_user = e.target.value;
                  setAssistantEditValuesArray(arr);
                }} placeholder="Output Token/User" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[160px]">Output Token/Assistant:</span>
                <Input value={a.output_token_per_assistant} onChange={e => {
                  const arr = [...assistantEditValuesArray];
                  arr[idx].output_token_per_assistant = e.target.value;
                  setAssistantEditValuesArray(arr);
                }} placeholder="Output Token/Assistant" />
              </div>
            </>
          )}
          {editedOrgKeys.includes("file_count") && (
            <div className="flex items-center gap-2">
              <span className="font-medium min-w-[160px]">File Count:</span>
              <Input value={a.file_count} onChange={e => {
                const arr = [...assistantEditValuesArray];
                arr[idx].file_count = e.target.value;
                setAssistantEditValuesArray(arr);
              }} placeholder="File Count" />
            </div>
          )}
          {editedOrgKeys.includes("file_size") && (
            <div className="flex items-center gap-2">
              <span className="font-medium min-w-[160px]">File Size:</span>
              <Input value={a.file_size} onChange={e => {
                const arr = [...assistantEditValuesArray];
                arr[idx].file_size = e.target.value;
                setAssistantEditValuesArray(arr);
              }} placeholder="File Size" />
            </div>
          )}
          {editedOrgKeys.includes("knowledge_base_index_size") && (
            <div className="flex items-center gap-2">
              <span className="font-medium min-w-[160px]">KB Index Size:</span>
              <Input value={a.knowledge_base_index_size} onChange={e => {
                const arr = [...assistantEditValuesArray];
                arr[idx].knowledge_base_index_size = e.target.value;
                setAssistantEditValuesArray(arr);
              }} placeholder="KB Index Size" />
            </div>
          )}
        </div>
      </div>
    ))}
    <Button variant="default" onClick={onSave}>Save All</Button>
    <Button variant="outline" onClick={onBack}>Back</Button>
  </div>
);

export default AssistantForm;