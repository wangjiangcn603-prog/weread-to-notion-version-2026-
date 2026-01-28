/**
 * 常量定义文件
 */
import * as path from "path";

// 微信读书API配置
export const WEREAD_BASE_URL = "https://weread.qq.com";
export const NOTEBOOK_API = `${WEREAD_BASE_URL}/api/user/notebook`;
export const BOOKMARKS_API = `${WEREAD_BASE_URL}/web/book/bookmarklist`;
export const BOOKSHELF_URL = `${WEREAD_BASE_URL}/web/shelf/sync`;
export const BOOK_INFO_URL = `${WEREAD_BASE_URL}/api/book/info`;
export const BOOK_THOUGHTS_API = `${WEREAD_BASE_URL}/web/review/list`;
export const BOOK_PROGRESS_API = `${WEREAD_BASE_URL}/web/book/getProgress`;

// Notion API 配置
export const NOTION_VERSION = process.env.NOTION_VERSION || "2025-09-03";
export const NOTION_API_BASE_URL = "https://api.notion.com/v1";

// 同步状态路径
export const SYNC_STATE_DIR = path.resolve(process.cwd(), "data", "sync-state");
