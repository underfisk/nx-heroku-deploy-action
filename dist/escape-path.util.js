"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapePath = void 0;
function escapePath(path) {
    return path[0] === "." && path[1] === "/"
        ? path.slice(2)
        : path[0] === "/"
            ? path.slice(1)
            : path;
}
exports.escapePath = escapePath;
