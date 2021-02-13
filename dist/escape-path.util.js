"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapePath = void 0;
function escapePath(path) {
    return path.startsWith('.') && path[1] === '/'
        ? path.slice(2)
        : path.startsWith('/')
            ? path.slice(1)
            : path;
}
exports.escapePath = escapePath;
