export function escapePath(path: string): string {
    return path[0] === "." && path[1] === "/"
        ? path.slice(2)
        : path[0] === "/"
            ? path.slice(1)
            : path
}