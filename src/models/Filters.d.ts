import type { FilterMatchMode, FilterOperator } from 'primevue/api'

interface FilterConstraint {
  value: null
  matchMode: FilterMatchMode | string // custom string like 'filterRepositoriesByStartsWith'
}

interface FieldFilter {
  operator: FilterOperator
  constraints: FilterConstraint[]
}

interface GlobalFilter {
  value: null
  matchMode: FilterMatchMode
}

export interface Filters {
  global: GlobalFilter
  html_url: FieldFilter
  updated_at: FieldFilter
}
