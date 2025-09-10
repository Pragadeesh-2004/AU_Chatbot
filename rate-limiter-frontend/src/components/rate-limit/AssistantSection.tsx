"use client";

import React from "react";
import SearchInput from "./SearchInput";
import AssistantTable from "./AssistantTable";
import TablePagination from "./TablePagination";

interface AssistantSectionProps {
  title?: string;
  assistants: any[];
  assistantsMap: { [key: string]: string };
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  editAssistantId: string | null;
  assistantValues: any;
  setAssistantValues: (values: any) => void;
  onEdit: (assistant: any) => void;
  onSave: (assistant: any) => void;
  onCancel: () => void;
  assistantLoading: boolean;
  showEdit: boolean;
  // Action props for organization owner
  showActions?: boolean;
  onReset?: (assistant: any) => void;
  onDelete?: (assistant: any) => void;
  menuOpenId?: string | null;
  onMenuToggle?: (id: string | null) => void;
  menuRef?: React.RefObject<HTMLDivElement | null>;
}

const AssistantSection: React.FC<AssistantSectionProps> = ({
  title = "Assistant Details",
  assistants,
  assistantsMap,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search Assistant",
  currentPage,
  totalPages,
  onPageChange,
  editAssistantId,
  assistantValues,
  setAssistantValues,
  onEdit,
  onSave,
  onCancel,
  assistantLoading,
  showEdit,
  showActions,
  onReset,
  onDelete,
  menuOpenId,
  onMenuToggle,
  menuRef
}) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-4">
      {/* Title and Search - both inside the card */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>
      
      <AssistantTable
        assistants={assistants}
        assistantsMap={assistantsMap}
        editAssistantId={editAssistantId}
        assistantValues={assistantValues}
        setAssistantValues={setAssistantValues}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        assistantLoading={assistantLoading}
        showEdit={showEdit}
        searchTerm={searchValue}
        showActions={showActions}
        onDelete={onDelete}
        menuOpenId={menuOpenId}
        onMenuToggle={onMenuToggle}
        menuRef={menuRef}
      />
      
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default AssistantSection;