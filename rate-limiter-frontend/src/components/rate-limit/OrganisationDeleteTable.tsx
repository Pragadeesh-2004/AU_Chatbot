import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type Organisation = {
  org_id: string;
};

type OrganisationDeleteTableProps = {
  organisations: Organisation[];
  organisationMap: { [key: string]: string };
  onDelete: (org: Organisation) => void;
  onViewAssistants: (org: Organisation) => void;
};

const OrganisationDeleteTable = ({
  organisations,
  organisationMap,
  onDelete,
  onViewAssistants,
}: OrganisationDeleteTableProps) => (
  <Table className="w-full mb-4">
    <TableHeader>
      <TableRow>
        <TableHead >Organisation</TableHead>
        <TableHead >Delete</TableHead>
        <TableHead >Assistants</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {organisations.length === 0 ? (
        <TableRow>
          <TableCell colSpan={3} >No organisation found.</TableCell>
        </TableRow>
      ) : (
        organisations.map(org => (
          <TableRow key={org.org_id}>
            <TableCell>{organisationMap[org.org_id] || org.org_id}</TableCell>
            <TableCell>
              <Button variant="destructive" size="sm" onClick={() => onDelete(org)}>
                Delete
              </Button>
            </TableCell>
            <TableCell >
              <Button variant="default" size="sm" onClick={() => onViewAssistants(org)}>
                View Assistants
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export default OrganisationDeleteTable;