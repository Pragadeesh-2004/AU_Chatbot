"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchInput from "./SearchInput";

export interface AssistantTableProps {
  assistants: any[];
  assistantsMap: { [key: string]: string };
  editAssistantId: string | null;
  assistantValues: any;
  setAssistantValues: (values: any) => void;
  onEdit: (assistant: any) => void;
  onSave: (assistant: any) => void;
  onCancel: () => void;
  assistantLoading: boolean;
  showEdit: boolean;
  searchTerm: string;
  showActions?: boolean;
  onDelete?: (assistant: any) => void;
  menuOpenId?: string | null;
  onMenuToggle?: (id: string | null) => void;
  menuRef?: React.RefObject<HTMLDivElement | null>;
}

const AssistantTable: React.FC<AssistantTableProps> = ({ 
  assistants, 
  assistantsMap, 
  editAssistantId,
  assistantValues,
  setAssistantValues,
  onEdit,
  onSave,
  onCancel,
  assistantLoading,
  showEdit = false,
  searchTerm
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Assistant Name</TableHead>
          <TableHead>Input/User</TableHead>
          <TableHead>Input/Assistant</TableHead>
          <TableHead>Output/User</TableHead>
          <TableHead>Output/Assistant</TableHead>
          <TableHead>File Count</TableHead>
          <TableHead>File Size</TableHead>
          <TableHead>KB Index Size</TableHead>
          {showEdit && <TableHead>Edit</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assistants.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showEdit ? 9 : 8} className="text-center text-muted-foreground">
              {searchTerm ? `No assistants found matching "${searchTerm}"` : "No assistant data found."}
            </TableCell>
          </TableRow>
        ) : (
          assistants.map((assistant: any) => (
            <TableRow key={assistant.assistant_id || assistant._id}>
              {editAssistantId === (assistant.assistant_id || assistant._id) ? (
                <>
                  <TableCell>{assistantsMap[assistant.assistant_id || assistant._id] || ""}</TableCell>
                  <TableCell>
                    <SearchInput 
                      value={assistantValues.input_token_per_user ?? ""} 
                      onChange={e => setAssistantValues({ ...assistantValues, input_token_per_user: e.target.value })} 
                      className="w-full" 
                    />
                  </TableCell>
                  <TableCell>
                    <SearchInput 
                      value={assistantValues.input_token_per_assistant ?? ""} 
                      onChange={e => setAssistantValues({ ...assistantValues, input_token_per_assistant: e.target.value })} 
                      className="w-full" 
                    />
                  </TableCell>
                  <TableCell>
                    <SearchInput 
                      value={assistantValues.output_token_per_user ?? ""} 
                      onChange={e => setAssistantValues({ ...assistantValues, output_token_per_user: e.target.value })} 
                      className="w-full" 
                    />
                  </TableCell>
                  <TableCell>
                    <SearchInput 
                      value={assistantValues.output_token_per_assistant ?? ""} 
                      onChange={e => setAssistantValues({ ...assistantValues, output_token_per_assistant: e.target.value })} 
                      className="w-full" 
                    />
                  </TableCell>
                  <TableCell>
                    <SearchInput 
                      value={assistantValues.file_count ?? ""} 
                      onChange={e => setAssistantValues({ ...assistantValues, file_count: e.target.value })} 
                      className="w-full" 
                    />
                  </TableCell>
                  <TableCell>
                    <SearchInput 
                      value={assistantValues.file_size ?? ""} 
                      onChange={e => setAssistantValues({ ...assistantValues, file_size: e.target.value })} 
                      className="w-full" 
                    />
                  </TableCell>
                  <TableCell>
                    <SearchInput 
                      value={assistantValues.knowledge_base_index_size ?? ""} 
                      onChange={e => setAssistantValues({ ...assistantValues, knowledge_base_index_size: e.target.value })} 
                      className="w-full" 
                    />
                  </TableCell>
                  {showEdit && (
                    <TableCell className="space-x-2">
                      <Button variant="default" size="sm" onClick={() => onSave(assistant)} disabled={assistantLoading}>
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                      </Button>
                    </TableCell>
                  )}
                </>
              ) : (
                <>
                  <TableCell>{assistantsMap[assistant.assistant_id || assistant._id] || ""}</TableCell>
                  <TableCell>{assistant.input_token_per_user}</TableCell>
                  <TableCell>{assistant.input_token_per_assistant}</TableCell>
                  <TableCell>{assistant.output_token_per_user}</TableCell>
                  <TableCell>{assistant.output_token_per_assistant}</TableCell>
                  <TableCell>{assistant.file_count}</TableCell>
                  <TableCell>{assistant.file_size}</TableCell>
                  <TableCell>{assistant.knowledge_base_index_size}</TableCell>
                  {showEdit && (
                    <TableCell>
                      <Button variant="default" size="sm" onClick={() => onEdit(assistant)}>
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default AssistantTable;