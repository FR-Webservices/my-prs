import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import type { Filters } from './Filters'

export const initialFilters: Filters = {
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  html_url: {
    operator: FilterOperator.AND,
    constraints: [
      {
        value: null,
        matchMode: 'filterRepositoriesByStartsWith',
      },
    ],
  },
  updated_at: {
    operator: FilterOperator.AND,
    constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
  },
}
