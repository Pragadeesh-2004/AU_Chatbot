import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface AssistantDeleteTableProps {
  assistants: any[];
  assistantsMap: { [key: string]: string };
  onDelete: (assistant: any) => void;
}

const AssistantDeleteTable: React.FC<AssistantDeleteTableProps> = ({
  assistants,
  assistantsMap,
  onDelete,
}) => (
  <Table className="w-full mb-4">
    <TableHeader>
      <TableRow>
        <TableHead >Assistant Name</TableHead>
        <TableHead >Delete</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {assistants.length === 0 ? (
        <TableRow>
          <TableCell colSpan={2}>No assistant found.</TableCell>
        </TableRow>
      ) : (
        assistants.map(assistant => (
          <TableRow key={assistant.assistant_id || assistant._id}>
            <TableCell>
              {assistantsMap[assistant.assistant_id || assistant._id] || assistant.assistant_id || assistant._id}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(assistant)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export default AssistantDeleteTable;