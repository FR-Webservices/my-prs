import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import type {
  DataTableFilterMeta,
  DataTableFilterMetaData,
  DataTableOperatorFilterMetaData,
} from 'primevue/datatable'

export const initialFilters: DataTableFilterMeta = {
  global: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  } as DataTableFilterMetaData,
  html_url: {
    operator: FilterOperator.AND,
    constraints: [
      {
        value: null,
        matchMode: 'filterRepositoriesByStartsWith',
      },
    ],
  } as DataTableOperatorFilterMetaData,
  updated_at: {
    operator: FilterOperator.AND,
    constraints: [
      {
        value: null,
        matchMode: FilterMatchMode.DATE_IS,
      },
    ],
  } as DataTableOperatorFilterMetaData,
}
