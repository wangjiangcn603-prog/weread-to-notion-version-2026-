"use strict";
/**
 * 作者过滤功能测试脚本
 */
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
const cookie_1 = require("./utils/cookie");
const services_1 = require("./api/weread/services");
const formatter_1 = require("./core/formatter");
const config_service_1 = require("./api/notion/config-service");
const book_filter_1 = require("./core/book-filter");
// 加载环境变量
dotenv_1.default.config({ path: ".env" });
function testAuthorFilter() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== 作者过滤功能测试 ===");
            // 获取环境变量
            const NOTION_API_KEY = process.env.NOTION_INTEGRATIONS;
            const CONFIG_DATABASE_ID = process.env.CONFIG_DATABASE_ID;
            if (!NOTION_API_KEY) {
                console.error("错误: 缺少 NOTION_INTEGRATIONS 环境变量");
                return;
            }
            if (!CONFIG_DATABASE_ID) {
                console.error("错误: 缺少 CONFIG_DATABASE_ID 环境变量");
                return;
            }
            console.log(`配置数据库ID: ${CONFIG_DATABASE_ID}`);
            // 1. 获取微信读书数据
            let cookie = (0, cookie_1.getBrowserCookie)();
            console.log("成功加载Cookie");
            // 刷新会话
            cookie = yield (0, services_1.refreshSession)(cookie);
            console.log("会话已刷新");
            // 2. 获取书籍数据
            const shelfBooks = yield (0, services_1.getBookshelfBooks)(cookie);
            const notebookBooks = yield (0, services_1.getNotebookBooks)(cookie);
            const allBooks = yield (0, formatter_1.enhanceBookMetadata)(cookie, shelfBooks, notebookBooks);
            console.log("\n=== 书架中的所有作者 ===");
            const authors = new Set();
            allBooks.forEach((book) => {
                const author = book.author || "未知作者";
                authors.add(author);
            });
            console.log("发现的作者列表:");
            Array.from(authors)
                .sort()
                .forEach((author) => {
                const count = allBooks.filter((book) => (book.author || "未知作者") === author).length;
                console.log(`  - ${author}: ${count} 本书`);
            });
            // 3. 加载配置
            console.log("\n=== 加载配置 ===");
            const config = yield (0, config_service_1.loadLibraryConfig)(NOTION_API_KEY, CONFIG_DATABASE_ID);
            // 4. 测试过滤
            console.log("\n=== 测试过滤效果 ===");
            const filteredBooks = (0, book_filter_1.filterBooksByConfig)(allBooks, config);
            (0, book_filter_1.showFilterStats)(allBooks, filteredBooks, config);
            console.log("\n=== 过滤后的书籍列表 ===");
            filteredBooks.forEach((book, index) => {
                console.log(`${index + 1}. 《${book.title}》 - 作者: ${book.author || "未知作者"} - 状态: ${book.finishReadingStatus}`);
            });
            console.log("\n=== 测试完成 ===");
        }
        catch (error) {
            console.error("测试失败:", error.message);
        }
    });
}
// 运行测试
testAuthorFilter().catch((error) => {
    console.error("测试执行失败:", error);
});
