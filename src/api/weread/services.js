"use strict";
/**
 * 微信读书API服务模块
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
exports.getBookProgress = void 0;
exports.refreshSession = refreshSession;
exports.getNotebookBooks = getNotebookBooks;
exports.getBookshelfBooks = getBookshelfBooks;
exports.getBookInfo = getBookInfo;
exports.getBookHighlights = getBookHighlights;
exports.getBookThoughts = getBookThoughts;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../../config/constants");
const http_1 = require("../../utils/http");
const cookie_1 = require("../../utils/cookie");
const book_progress_1 = require("./book-progress");
Object.defineProperty(exports, "getBookProgress", { enumerable: true, get: function () { return book_progress_1.getBookProgress; } });
/**
 * 刷新微信读书会话
 */
function refreshSession(currentCookie) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("正在刷新微信读书会话...");
        // 需要按顺序访问的页面
        const urlsToVisit = [
            `${constants_1.WEREAD_BASE_URL}/`, // 首页
            `${constants_1.WEREAD_BASE_URL}/web/shelf`, // 书架页
        ];
        let updatedCookie = currentCookie;
        for (const url of urlsToVisit) {
            try {
                console.log(`访问: ${url}`);
                const headers = Object.assign(Object.assign({}, (0, http_1.getHeaders)(updatedCookie)), { Referer: "https://weread.qq.com/" });
                const response = yield axios_1.default.get(url, {
                    headers,
                    maxRedirects: 5,
                });
                // 检查是否有新Cookie
                if (response.headers["set-cookie"]) {
                    const newCookies = response.headers["set-cookie"];
                    console.log("服务端返回了新的Cookie");
                    // 更新Cookie
                    updatedCookie = (0, cookie_1.updateCookieFromResponse)(updatedCookie, newCookies);
                }
                // 休眠300ms，模拟真实浏览行为
                yield new Promise((resolve) => setTimeout(resolve, 300));
            }
            catch (error) {
                console.error(`访问${url}失败:`, error.message);
            }
        }
        return updatedCookie;
    });
}
/**
 * 从微信读书笔记本获取书籍列表
 */
function getNotebookBooks(cookie) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n=== 从微信读书笔记本获取书籍列表 ===");
        console.log("API URL:", constants_1.NOTEBOOK_API);
        try {
            // 设置请求头
            const headers = (0, http_1.getHeaders)(cookie);
            const response = yield axios_1.default.get(constants_1.NOTEBOOK_API, { headers });
            // 检查是否登录超时
            if (response.data.errCode === -2012) {
                console.log("检测到登录超时，正在重新刷新会话...");
                const newCookie = yield refreshSession(cookie);
                // 重新发起请求
                return getNotebookBooks(newCookie);
            }
            if (response.data.books && response.data.books.length > 0) {
                console.log(`笔记本中共有 ${response.data.books.length} 本书`);
                return response.data.books;
            }
            else if (response.data.errCode) {
                console.error(`API错误: ${response.data.errCode} - ${response.data.errMsg}`);
                return [];
            }
            else {
                console.log("笔记本中没有书籍");
                return [];
            }
        }
        catch (error) {
            console.error("请求失败:", error.message);
            if (error.response) {
                console.error("响应状态:", error.response.status);
                console.error("响应数据:", error.response.data);
            }
            return [];
        }
    });
}
/**
 * 从微信读书书架获取书籍列表
 */
function getBookshelfBooks(cookie) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n=== 从微信读书书架获取书籍列表 ===");
        console.log("API URL:", constants_1.BOOKSHELF_URL);
        try {
            // 设置请求头
            const headers = (0, http_1.getHeaders)(cookie);
            const response = yield axios_1.default.get(constants_1.BOOKSHELF_URL, { headers });
            // 检查是否登录超时
            if (response.data.errCode === -2012) {
                console.log("检测到登录超时，正在重新刷新会话...");
                const newCookie = yield refreshSession(cookie);
                // 重新发起请求
                return getBookshelfBooks(newCookie);
            }
            if (response.data.books && response.data.books.length > 0) {
                console.log(`书架中共有 ${response.data.books.length} 本书`);
                return response.data.books;
            }
            else if (response.data.errCode) {
                console.error(`API错误: ${response.data.errCode} - ${response.data.errMsg}`);
                return [];
            }
            else {
                console.log("书架中没有书籍");
                return [];
            }
        }
        catch (error) {
            console.error("请求失败:", error.message);
            if (error.response) {
                console.error("响应状态:", error.response.status);
                console.error("响应数据:", error.response.data);
            }
            return [];
        }
    });
}
/**
 * 获取书籍的详细信息
 */
function getBookInfo(cookie, bookId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`获取书籍(ID: ${bookId})的详细信息...`);
        const url = `${constants_1.BOOK_INFO_URL}?bookId=${bookId}`;
        try {
            // 设置请求头
            const headers = (0, http_1.getHeaders)(cookie);
            const response = yield axios_1.default.get(url, { headers });
            // 检查是否登录超时
            if (response.data.errCode === -2012) {
                console.log("检测到登录超时，正在重新刷新会话...");
                const newCookie = yield refreshSession(cookie);
                // 重新发起请求
                return getBookInfo(newCookie, bookId);
            }
            return response.data;
        }
        catch (error) {
            console.error(`获取书籍信息失败:`, error.message);
            return null;
        }
    });
}
/**
 * 获取书籍的划线数据
 */
function getBookHighlights(cookie_2, bookId_1) {
    return __awaiter(this, arguments, void 0, function* (cookie, bookId, synckey = "0") {
        console.log(`\n获取书籍(ID: ${bookId})的划线...`);
        const url = `${constants_1.BOOKMARKS_API}?bookId=${bookId}&synckey=${synckey}`;
        try {
            // 设置请求头，使用特殊的划线请求头
            const headers = (0, http_1.getHighlightHeaders)(cookie, bookId);
            console.log(`发送请求到: ${url} 使用synckey: ${synckey}`);
            const response = yield axios_1.default.get(url, { headers });
            // 检查是否登录超时
            if (response.data.errCode === -2012) {
                console.log("检测到登录超时，正在重新刷新会话...");
                const newCookie = yield refreshSession(cookie);
                // 重新发起请求
                return getBookHighlights(newCookie, bookId, synckey);
            }
            // 检查响应数据
            if (response.data) {
                if (response.data.synckey) {
                    console.log(`获取到新的highlightsSynckey: ${response.data.synckey}`);
                }
                if (response.data.updated && response.data.updated.length > 0) {
                    console.log(`找到 ${response.data.updated.length} 条新的划线记录`);
                }
                else if (response.data.chapters && response.data.chapters.length > 0) {
                    console.log(`找到 ${response.data.chapters.length} 个章节数据`);
                }
                else {
                    console.log(`未找到新的划线数据`);
                }
            }
            return response.data;
        }
        catch (error) {
            console.error(`获取书籍划线失败:`, error.message);
            if (error.response) {
                console.error(`响应状态: ${error.response.status}`);
                console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
            }
            else {
                console.error(`请求失败，无响应数据`);
            }
            return null;
        }
    });
}
/**
 * 获取书籍的想法数据
 */
function getBookThoughts(cookie_2, bookId_1) {
    return __awaiter(this, arguments, void 0, function* (cookie, bookId, synckey = "0") {
        console.log(`\n获取书籍(ID: ${bookId})的想法...`);
        const url = `${constants_1.BOOK_THOUGHTS_API}?bookId=${bookId}&listType=11&mine=1&synckey=${synckey}`;
        try {
            // 设置请求头
            const headers = (0, http_1.getHighlightHeaders)(cookie, bookId);
            console.log(`发送请求到: ${url} 使用synckey: ${synckey}`);
            const response = yield axios_1.default.get(url, { headers });
            // 检查是否登录超时
            if (response.data.errCode === -2012) {
                console.log("检测到登录超时，正在重新刷新会话...");
                const newCookie = yield refreshSession(cookie);
                // 重新发起请求
                return getBookThoughts(newCookie, bookId, synckey);
            }
            // 检查响应数据
            if (response.data.reviews && response.data.reviews.length > 0) {
                console.log(`找到 ${response.data.reviews.length} 条想法`);
            }
            else if (response.data.errCode) {
                console.error(`API错误: ${response.data.errCode} - ${response.data.errMsg || "未知错误"}`);
                return null;
            }
            else {
                console.log("未获取到任何新的想法数据");
            }
            // 检查是否有新的synckey
            if (response.data.synckey) {
                console.log(`获取到新的thoughtsSynckey: ${response.data.synckey}`);
            }
            return response.data;
        }
        catch (error) {
            console.error(`获取书籍想法失败:`, error.message);
            if (error.response) {
                console.error(`响应状态: ${error.response.status}`);
                console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
            }
            return null;
        }
    });
}
