export function escapePath(path: string): string {
  return path.startsWith('.') && path[1] === '/'
    ? path.slice(2)
    : path.startsWith('/')
    ? path.slice(1)
    : path
}
