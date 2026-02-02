import * as schema from "@/database/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PgTable } from "drizzle-orm/pg-core";
import { getTableColumns } from "drizzle-orm";

export default function SchemaPage() {
  // Filter only PgTable instances from the schema exports
  const tables = Object.entries(schema)
    .filter(([_, value]) => value instanceof PgTable)
    .map(([key, value]) => {
      // @ts-ignore - Drizzle internals
      const tableName = value[Symbol.for("drizzle:Name")] || value._.name;
      const columns = getTableColumns(value as PgTable);
      return {
        key,
        name: tableName,
        columns: Object.entries(columns).map(([colKey, colValue]) => ({
          name: colKey,
          // @ts-ignore
          type: colValue.dataType,
          // @ts-ignore
          notNull: colValue.notNull,
          // @ts-ignore
          default: colValue.default,
          // @ts-ignore
          primaryKey: colValue.primary,
        })),
      };
    });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Database Schema
        </h1>
        <p className="text-xl text-muted-foreground">
          System database structure documentation.
        </p>
      </div>

      <div className="grid gap-8">
        {tables.map((table) => (
          <Card key={table.name} id={table.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-mono">
                  {table.name}
                </CardTitle>
                <Badge variant="outline">{table.key}</Badge>
              </div>
              <CardDescription>{table.columns.length} columns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Attributes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.columns.map((col) => (
                    <TableRow key={col.name}>
                      <TableCell className="font-medium font-mono">
                        {col.name}
                        {col.primaryKey && (
                          <span className="ml-2 text-xs text-primary">
                            (PK)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {col.type}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {col.notNull && (
                            <Badge variant="secondary" className="text-[10px]">
                              Not Null
                            </Badge>
                          )}
                          {col.default !== undefined && (
                            <Badge variant="outline" className="text-[10px]">
                              Default
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
