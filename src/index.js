"use strict";
/**
 * 微信读书 → Notion 同步工具 主程序
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const cli_1 = require("./core/cli");
const book_sync_1 = require("./core/sync/book-sync");
const all_books_sync_1 = require("./core/sync/all-books-sync");
const all_books_sync_with_config_1 = require("./core/sync/all-books-sync-with-config");
const cookie_1 = require("./utils/cookie");
const services_1 = require("./api/weread/services");
const migration_1 = require("./core/migration");
// 环境变量文件路径
const ENV_FILE_PATH = ".env";
// 加载环境变量
dotenv_1.default.config({ path: ENV_FILE_PATH });
/**
 * 主函数：根据命令行参数执行相应的同步操作
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== 微信读书 → Notion 同步开始 ===");
            // 获取环境变量
            const NOTION_API_KEY = process.env.NOTION_INTEGRATIONS;
            const DATABASE_ID = process.env.DATABASE_ID;
            const CONFIG_DATABASE_ID = process.env.CONFIG_DATABASE_ID;
            // 验证必要的环境变量
            if (!NOTION_API_KEY) {
                console.error("错误: 缺少 NOTION_INTEGRATIONS 环境变量");
                return;
            }
            if (!DATABASE_ID) {
                console.error("错误: 缺少 DATABASE_ID 环境变量");
                return;
            }
            // 解析命令行参数
            const { bookId, syncAll, fullSync: cliFullSync } = (0, cli_1.parseArgs)();
            let fullSync = cliFullSync;
            // 检查数据库版本并执行必要的迁移
            try {
                const needsMigration = yield (0, migration_1.checkAndMigrateIfNeeded)(NOTION_API_KEY, DATABASE_ID);
                // 如果需要迁移，强制使用全量同步模式
                if (needsMigration) {
                    console.log("检测到数据库版本变更，将强制使用全量同步模式");
                    fullSync = true;
                }
            }
            catch (error) {
                console.error(`数据库版本检查失败: ${error.message}`);
                console.log("将继续使用原定同步模式");
            }
            console.log(`同步模式: ${fullSync ? "全量" : "增量"}`);
            // 获取微信读书Cookie
            let cookie = (0, cookie_1.getBrowserCookie)();
            console.log("成功加载Cookie");
            // 刷新会话
            cookie = yield (0, services_1.refreshSession)(cookie);
            console.log("会话已刷新");
            if (syncAll) {
                // 同步所有书籍
                if (CONFIG_DATABASE_ID) {
                    console.log("检测到配置数据库ID，将使用配置过滤同步");
                    // 加载配置，决定 useIncremental
                    const { loadLibraryConfig } = yield Promise.resolve().then(() => __importStar(require("./api/notion/config-service")));
                    const config = yield loadLibraryConfig(NOTION_API_KEY, CONFIG_DATABASE_ID);
                    let useIncremental = config.syncMode !== "全量";
                    // 命令行 --full-sync 优先级更高
                    if (cliFullSync)
                        useIncremental = false;
                    yield (0, all_books_sync_with_config_1.syncAllBooksWithConfig)(NOTION_API_KEY, DATABASE_ID, cookie, useIncremental, CONFIG_DATABASE_ID);
                }
                else {
                    console.log("未配置CONFIG_DATABASE_ID，使用默认同步（所有书籍）");
                    yield (0, all_books_sync_1.syncAllBooks)(NOTION_API_KEY, DATABASE_ID, cookie, !fullSync);
                }
            }
            else if (bookId) {
                // 同步单本书籍
                let organizeByChapter = false;
                if (CONFIG_DATABASE_ID) {
                    const { loadLibraryConfig } = yield Promise.resolve().then(() => __importStar(require("./api/notion/config-service")));
                    const config = yield loadLibraryConfig(NOTION_API_KEY, CONFIG_DATABASE_ID);
                    organizeByChapter = config.organizeByChapter === "是";
                }
                yield (0, book_sync_1.syncSingleBook)(NOTION_API_KEY, DATABASE_ID, cookie, bookId, !fullSync, organizeByChapter);
            }
            else {
                console.log("请指定要同步的书籍ID (--bookId=xxx) 或使用 --all 同步所有书籍");
                console.log("添加 --full-sync 或 -f 参数可进行全量同步（而非增量）");
            }
            console.log("\n=== 同步完成 ===");
        }
        catch (error) {
            console.error("同步过程中发生错误:", error.message);
        }
    });
}
// 运行主函数
main().catch((error) => {
    console.error("程序执行失败:", error);
});
