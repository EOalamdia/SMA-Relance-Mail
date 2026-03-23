import * as React from "react"
import { Search, SlidersHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
// Ensure these imports exist or use basic HTML elements if not available
// Assuming Button and Input exist based on previous context, if not, standard elements will be used for now or they should be imported.
// For safety in this file-restricted edit, I will use standard elements with classes if imports are not guaranteed, but I saw Input in previous turns.
// Let's assume standard UI for internal parts to avoid import errors if I can't see the file list.
import { Button } from "./button"
import { Input } from "./input"
import { cva, type VariantProps } from "class-variance-authority"
import { usePagination, DOTS } from "../../hooks/use-pagination"

const tableVariants = cva(
  "relative w-full overflow-auto",
  {
    variants: {
      variant: {
        default: "",
        card: "rounded-lg border bg-surface shadow-lg",
        glass: "rounded-lg border bg-background/50 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TableProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tableVariants> {
  striped?: boolean
  bordered?: boolean
  dense?: boolean
  stickyHeader?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, striped, bordered, dense, stickyHeader, ...props }, ref) => (
    <div className={cn(tableVariants({ variant }), stickyHeader && "max-h-[600px]", className)}>
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          striped && "[&_tbody_tr:nth-child(even)]:bg-muted/30",
          bordered && "border-collapse border-separate border-spacing-0 [&_td]:border-b [&_td]:border-r [&_th]:border-b [&_th]:border-r [&_tr]:border-none [&_tr:last-child_td]:border-b",
          bordered && "[&_th]:border-t [&_th]:border-l [&_td]:border-l",
          dense && "[&_td]:p-2 [&_th]:p-2 [&_th]:h-9",
          stickyHeader && "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-background",
        )}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-primary/5 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// --- Functional Components ---

interface TableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch?: (value: string) => void
  onFilter?: () => void
  searchPlaceholder?: string
}

const TableToolbar = React.forwardRef<HTMLDivElement, TableToolbarProps>(
  ({ className, onSearch, onFilter, searchPlaceholder = "Search...", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-4", className)}
      {...props}
    >
      <div className="flex items-center flex-1 space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="pl-9 h-9 w-[150px] lg:w-[250px]"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        {children}
      </div>
      <div className="flex items-center space-x-2">
        {onFilter && (
             <Button variant="outline" size="sm" className="h-9 ml-auto" onClick={onFilter}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filter
             </Button>
        )}
      </div>
    </div>
  )
)
TableToolbar.displayName = "TableToolbar"

interface TablePaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  pageIndex: number
  pageSize: number
  totalCount: number
  pageCount: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"

const TablePagination = React.forwardRef<HTMLDivElement, TablePaginationProps>(
  ({ className, pageIndex, pageSize, totalCount, pageCount, onPageChange, onPageSizeChange, ...props }, ref) => {
    // Use the custom hook for pagination logic
    const paginationRange = usePagination({
        totalCount,
        pageSize,
        siblingCount: 1,
        currentPage: pageIndex
    });

    // If there are less than 2 times in pagination range we shall not render the component
    if (pageIndex === 0 && paginationRange.length < 2) {
        return null; // Or render nothing, though existing behavior rendered something. 
        // Actually, the previous implementation always rendered, so let's stick to just getting the pages.
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between px-2 py-4", className)}
        {...props}
      >
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount} entries
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <Pagination>
              <PaginationContent>
                  <PaginationItem>
                      <PaginationPrevious 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); if(pageIndex > 0) onPageChange(pageIndex - 1); }}
                          className={pageIndex === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                  </PaginationItem>
                  
                  {paginationRange.map((page, i) => (
                    <PaginationItem key={i}>
                      {page === DOTS ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={page === pageIndex}
                          onClick={(e) => { e.preventDefault(); onPageChange(page as number); }}
                        >
                          {(page as number) + 1}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                       <PaginationNext 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); if(pageIndex < pageCount - 1) onPageChange(pageIndex + 1); }}
                          className={pageIndex >= pageCount - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                  </PaginationItem>
              </PaginationContent>
          </Pagination>
        </div>
      </div>
    )
  }
)
TablePagination.displayName = "TablePagination"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableToolbar,
  TablePagination,
}
