'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

function GridTable({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <Table
      className={cn(
        'border-collapse text-[15px] [&_th]:border-b [&_td]:border-b [&_tr>*:not(:last-child)]:border-r [&_th]:border-[#d4d4d4] [&_td]:border-[#d4d4d4]',
        className,
      )}
      {...props}
    />
  )
}

function GridTableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <TableHeader
      className={cn('bg-[#efefef] [&_tr]:border-0', className)}
      {...props}
    />
  )
}

function GridTableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <TableRow
      className={cn('border-0 bg-white hover:bg-[#fafafa]', className)}
      {...props}
    />
  )
}

function GridTableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <TableHead
      className={cn(
        'h-12 px-4 text-[15px] font-medium text-[#3a3a3a] [&:has(svg)]:gap-1.5',
        className,
      )}
      {...props}
    />
  )
}

function GridTableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <TableCell
      className={cn('px-4 py-3 text-[#313131] text-[15px]', className)}
      {...props}
    />
  )
}

function TablePill({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full bg-[#ececec] px-3 py-0.5 text-[15px] font-medium text-[#333] truncate',
        className,
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  GridTable,
  GridTableHeader,
  GridTableRow,
  GridTableHead,
  GridTableCell,
  TablePill,
}
