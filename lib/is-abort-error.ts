export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export function logNonAbortError(error: unknown): void {
  if (isAbortError(error)) {
    return
  }

  console.error(error)
}
