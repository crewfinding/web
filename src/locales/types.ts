// Interpolation values for {param} placeholders in message strings.
export type MessageParams = Record<string, string | number>

// Union of dot-paths to every string leaf of a dictionary, e.g.
// 'auth.login.title'. Arrays are structured content (feature lists, article
// sections) — read those from the message tree directly, not through t().
export type MessagePath<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends readonly unknown[]
      ? never
      : T[K] extends object
        ? `${K}.${MessagePath<T[K]>}`
        : never
}[keyof T & string]
