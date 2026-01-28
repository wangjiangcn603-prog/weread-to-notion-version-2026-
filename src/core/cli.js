"use strict";
/**
 * 命令行参数解析模块
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = parseArgs;
/**
 * 解析命令行参数
 */
function parseArgs() {
    var _a;
    const args = process.argv.slice(2);
    const bookId = (_a = args.find((arg) => arg.startsWith("--bookId="))) === null || _a === void 0 ? void 0 : _a.split("=")[1];
    const syncAll = args.includes("--all") || args.includes("-a");
    const fullSync = args.includes("--full-sync") || args.includes("-f");
    return { bookId, syncAll, fullSync };
}
