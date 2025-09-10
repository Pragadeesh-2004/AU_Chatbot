import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "./BackButton";
import SearchInput from "./SearchInput";
import AssistantTable from "./AssistantTable";
import TablePagination from "./TablePagination";

type OrganisationViewProps = {
  organisation: any;
  organisationName: string;
  assistantData: any[];
  assistantsMap: Record<string, string>;
  assistantSearch: string;
  setAssistantSearch: (value: string) => void;
  assistantPage: number;
  setAssistantPage: React.Dispatch<React.SetStateAction<number>>;
  assistantTotalPages: number;
  onBack: () => void;
};

const OrganisationView: React.FC<OrganisationViewProps> = ({
  organisation,
  organisationName,
  assistantData,
  assistantsMap,
  assistantSearch,
  setAssistantSearch,
  assistantPage,
  setAssistantPage,
  assistantTotalPages,
  onBack,
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center">
        <BackButton onClick={onBack} />
        <CardTitle>Organisation: {organisationName}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div><b>Input Limit:</b> {organisation.max_input_token}</div>
        <div><b>Output Limit:</b> {organisation.max_output_token}</div>
        <div><b>File Count:</b> {organisation.file_count}</div>
        <div><b>File Size:</b> {organisation.file_size}</div>
        <div><b>Knowledge Base Count:</b> {organisation.knowledge_base_count}</div>
        <div><b>Knowledge Base Index Size:</b> {organisation.knowledge_base_index_size}</div>
        <div><b>Active Assistants:</b> {organisation.active_assistant_count}</div>
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
          editAssistantId={null}
          assistantValues={{}}
          setAssistantValues={() => { } }
          onEdit={() => { } }
          onSave={() => { } }
          onCancel={() => { } }
          assistantLoading={false}
          showEdit={false} searchTerm={""}        />
        <TablePagination
          currentPage={assistantPage}
          totalPages={assistantTotalPages}
          onPageChange={setAssistantPage}
        />
      </div>
    </CardContent>
  </Card>
);

export default OrganisationView;