import React from "react";
import { Button } from "@/components/ui/button";
import SearchInput from "./SearchInput";
import AssistantTable from "./AssistantTable";
import TablePagination from "./TablePagination";

type OrganisationSummaryProps = {
  orgEditValues: any;
  assistantData: any[];
  assistantsMap: Record<string, string>;
  assistantSearch: string;
  setAssistantSearch: (value: string) => void;
  assistantPage: number;
  setAssistantPage: React.Dispatch<React.SetStateAction<number>>;
  assistantTotalPages: number;
  editAssistantId: string | null;
  assistantValues: any;
  setAssistantValues: (values: any) => void;
  onAssistantEdit: (assistant: any) => void;
  onAssistantSave: (assistant: any) => void;
  onAssistantCancel: () => void;
  assistantLoading: boolean;
  onEditOrganisation: () => void;
};

const OrganisationSummary: React.FC<OrganisationSummaryProps> = ({
  orgEditValues,
  assistantData,
  assistantsMap,
  assistantSearch,
  setAssistantSearch,
  assistantPage,
  setAssistantPage,
  assistantTotalPages,
  editAssistantId,
  assistantValues,
  setAssistantValues,
  onAssistantEdit,
  onAssistantSave,
  onAssistantCancel,
  assistantLoading,
  onEditOrganisation,
}) => (
  <>
    <div className="mb-4 grid grid-cols-2 gap-2">
      <div><b>Input Limit:</b> {orgEditValues.max_input_token}</div>
      <div><b>Output Limit:</b> {orgEditValues.max_output_token}</div>
      <div><b>File Count:</b> {orgEditValues.file_count}</div>
      <div><b>File Size:</b> {orgEditValues.file_size}</div>
      <div><b>Knowledge Base Count:</b> {orgEditValues.knowledge_base_count}</div>
      <div><b>Knowledge Base Index Size:</b> {orgEditValues.knowledge_base_index_size}</div>
      <div><b>Active Assistants:</b> {orgEditValues.active_assistant_count}</div>
      <div>
        <Button variant="default" onClick={onEditOrganisation}>Edit Organisation</Button>
      </div>
    </div>
    
    <div className="border rounded-lg p-4 bg-white mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-lg">Assistant Details</h2>
        <SearchInput
          placeholder="Search Assistant"
          value={assistantSearch}
          onChange={e => setAssistantSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <AssistantTable
        assistants={assistantData}
        assistantsMap={assistantsMap}
        editAssistantId={editAssistantId}
        assistantValues={assistantValues}
        setAssistantValues={setAssistantValues}
        onEdit={onAssistantEdit}
        onSave={onAssistantSave}
        onCancel={onAssistantCancel}
        assistantLoading={assistantLoading}
        showEdit={true}
      />
      <TablePagination
        currentPage={assistantPage}
        totalPages={assistantTotalPages}
        onPageChange={setAssistantPage}
      />
    </div>
  </>
);

export default OrganisationSummary;