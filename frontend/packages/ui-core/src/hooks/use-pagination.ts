import { useMemo } from 'react';

export const DOTS = '...';

interface UsePaginationProps {
  totalCount: number;
  pageSize: number;
  siblingCount?: number;
  currentPage: number;
}

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

export const usePagination = ({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: UsePaginationProps) => {
  const paginationRange = useMemo(() => {
    // Current total usage:
    // (siblingCount + 5) corresponds to: 
    // first + last + current + 2*dots + 2*siblings?
    // Let's stick to the logic used in the original component but more generic.
    
    // Page count
    const totalPageCount = Math.ceil(totalCount / pageSize);


    /*
      Case 1:
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageCount <= 7) { 
      return range(0, totalPageCount - 1);
    }
    // Actually adhering to the previous logic:
    // previous logic: if (pageIndex < 4) ...
    
    // Let's reimplement exactly the logic from the Table component to ensure 1:1 behavior first, then clean up if needed.
    // Original logic:
    /*
      if (pageCount <= 7) {
        for (let i = 0; i < pageCount; i++) pages.push(i);
      } else {
        if (pageIndex < 4) {
          for (let i = 0; i < 5; i++) pages.push(i);
          pages.push('ellipsis');
          pages.push(pageCount - 1);
        } else if (pageIndex > pageCount - 5) {
          pages.push(0);
          pages.push('ellipsis');
          for (let i = pageCount - 5; i < pageCount; i++) pages.push(i);
        } else {
          pages.push(0);
          pages.push('ellipsis');
          for (let i = pageIndex - 1; i <= pageIndex + 1; i++) pages.push(i);
          pages.push('ellipsis');
          pages.push(pageCount - 1);
        }
      }
    */
    
    const pages: (number | string)[] = [];
         
    if (totalPageCount <= 7) {
        for (let i = 0; i < totalPageCount; i++) pages.push(i);
    } else {
        if (currentPage < 4) {
            for (let i = 0; i < 5; i++) pages.push(i);
            pages.push(DOTS);
            pages.push(totalPageCount - 1);
        } else if (currentPage > totalPageCount - 5) {
            pages.push(0);
            pages.push(DOTS);
            for (let i = totalPageCount - 5; i < totalPageCount; i++) pages.push(i);
        } else {
            pages.push(0);
            pages.push(DOTS);
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push(DOTS);
            pages.push(totalPageCount - 1);
        }
    }
    
    return pages;

  }, [totalCount, pageSize, siblingCount, currentPage]);

  return paginationRange;
};
