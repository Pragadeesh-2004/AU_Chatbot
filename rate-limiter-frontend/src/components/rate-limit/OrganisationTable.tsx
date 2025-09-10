"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ActionMenu from "./ActionMenu";

interface OrganisationTableProps {
  organisations: any[];
  organisationMap: { [key: string]: string };
  onView: (org: any) => void;
  onEdit: (org: any) => void;
  onDelete: (org: any) => void;
  menuOpenId: string | null;
  onMenuToggle: (orgId: string | null) => void;
  searchTerm?: string;
}

const OrganisationTable: React.FC<OrganisationTableProps> = ({ 
  organisations, 
  organisationMap, 
  onView,
  onEdit,
  onDelete,
  menuOpenId,
  onMenuToggle,
  searchTerm 
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organisation</TableHead>
          <TableHead>Input Limit</TableHead>
          <TableHead>Output Limit</TableHead>
          <TableHead>File Count</TableHead>
          <TableHead>File Size</TableHead>
          <TableHead>Knowledge Base Count</TableHead>
          <TableHead>Knowledge Base Index Size</TableHead>
          <TableHead>Active Assistants</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organisations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground">
              {searchTerm ? `No organisations found matching "${searchTerm}"` : "No organisations found."}
            </TableCell>
          </TableRow>
        ) : (
          organisations.map((org, idx) => (
            <TableRow key={org.org_id}>
              <TableCell>{organisationMap[org.org_id] || org.org_id}</TableCell>
              <TableCell>{org.max_input_token}</TableCell>
              <TableCell>{org.max_output_token}</TableCell>
              <TableCell>{org.file_count}</TableCell>
              <TableCell>{org.file_size}</TableCell>
              <TableCell>{org.knowledge_base_count}</TableCell>
              <TableCell>{org.knowledge_base_index_size}</TableCell>
              <TableCell>{org.active_assistant_count}</TableCell>
              <TableCell>
                <ActionMenu
                  isOpen={menuOpenId === org.org_id}
                  onToggle={() => onMenuToggle(menuOpenId === org.org_id ? null : org.org_id)}
                  onView={() => { onView(org); onMenuToggle(null); }}
                  onEdit={() => { onEdit(org); onMenuToggle(null); }}
                  onDelete={() => { onDelete(org); onMenuToggle(null); }}
                  isLastRow={idx === organisations.length - 1}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OrganisationTable;