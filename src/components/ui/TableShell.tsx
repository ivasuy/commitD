"use client";

import {
  tableWrapperClass,
  tableHeaderClass,
  tableHeaderCellClass,
  tableRowClass,
  tableCellClass,
} from "@/src/lib/ui/theme";
import { cn } from "@/src/lib/cn";

export interface TableShellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableShell({ children, className = "" }: TableShellProps) {
  return (
    <div className={cn(tableWrapperClass, className)}>
      <table className="min-w-full w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={tableHeaderClass} {...props}>
      {children}
    </thead>
  );
}

export function TableHeaderRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="border-b border-white/15" {...props} />;
}

export function TableHeaderCell(
  props: React.ThHTMLAttributes<HTMLTableCellElement>,
) {
  return (
    <th
      className={cn(tableHeaderCellClass, "border-b border-white/15")}
      {...props}
    />
  );
}

export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow({
  zebra,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { zebra?: boolean }) {
  return (
    <tr
      className={cn(
        tableRowClass,
        zebra && "even:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={tableCellClass} {...props} />;
}
