"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_STATE_DIR = exports.NOTION_API_BASE_URL = exports.NOTION_VERSION = exports.BOOK_PROGRESS_API = exports.BOOK_THOUGHTS_API = exports.BOOK_INFO_URL = exports.BOOKSHELF_URL = exports.BOOKMARKS_API = exports.NOTEBOOK_API = exports.WEREAD_BASE_URL = void 0;
/**
 * 常量定义文件
 */
const path = __importStar(require("path"));
// 微信读书API配置
exports.WEREAD_BASE_URL = "https://weread.qq.com";
exports.NOTEBOOK_API = `${exports.WEREAD_BASE_URL}/api/user/notebook`;
exports.BOOKMARKS_API = `${exports.WEREAD_BASE_URL}/web/book/bookmarklist`;
exports.BOOKSHELF_URL = `${exports.WEREAD_BASE_URL}/web/shelf/sync`;
exports.BOOK_INFO_URL = `${exports.WEREAD_BASE_URL}/api/book/info`;
exports.BOOK_THOUGHTS_API = `${exports.WEREAD_BASE_URL}/web/review/list`;
exports.BOOK_PROGRESS_API = `${exports.WEREAD_BASE_URL}/web/book/getProgress`;
// Notion API 配置
exports.NOTION_VERSION = process.env.NOTION_VERSION || "2025-09-03";
exports.NOTION_API_BASE_URL = "https://api.notion.com/v1";
// 同步状态路径
exports.SYNC_STATE_DIR = path.resolve(process.cwd(), "data", "sync-state");
