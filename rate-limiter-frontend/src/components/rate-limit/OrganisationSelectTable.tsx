import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface OrganisationSelectTableProps {
  organisations: any[];
  organisationMap: { [key: string]: string };
  onSelect: (org: any) => void;
}

const OrganisationSelectTable: React.FC<OrganisationSelectTableProps> = ({
  organisations,
  organisationMap,
  onSelect,
}) => (
  <Table className="w-full mb-4">
    <TableHeader>
      <TableRow>
        <TableHead>Organisation Name</TableHead>
        <TableHead >Action</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {organisations.length === 0 ? (
        <TableRow>
          <TableCell colSpan={2} >
            No organisation available.
          </TableCell>
        </TableRow>
      ) : (
        organisations.map(org => (
          <TableRow key={org._id}>
            <TableCell >
              {organisationMap[org._id] || org.name || org._id}
            </TableCell>
            <TableCell >
              <Button variant="default" size="sm" onClick={() => onSelect(org)}>
                Select
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export default OrganisationSelectTable;