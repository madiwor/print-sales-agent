export interface ApiOk<T = unknown> {
  ok:   true
  data: T
}

export interface ApiError {
  ok:      false
  error:   string
  code?:   number
}

export type ApiResponse<T = unknown> = ApiOk<T> | ApiError
