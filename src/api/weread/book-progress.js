"use strict";
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
exports.getBookProgress = getBookProgress;
/**
 * 获取书籍阅读进度信息
 */
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../../config/constants");
const http_1 = require("../../utils/http");
const services_1 = require("./services");
function getBookProgress(cookie, bookId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`\n获取书籍(ID: ${bookId})的阅读进度...`);
        const url = `${constants_1.BOOK_PROGRESS_API}?bookId=${bookId}`;
        try {
            // 设置请求头
            const headers = (0, http_1.getHeaders)(cookie);
            console.log(`发送请求到: ${url}`);
            const response = yield axios_1.default.get(url, { headers });
            // 检查是否登录超时
            if (response.data.errCode === -2012) {
                console.log("检测到登录超时，正在重新刷新会话...");
                const newCookie = yield (0, services_1.refreshSession)(cookie);
                // 重新发起请求
                return getBookProgress(newCookie, bookId);
            }
            // 检查响应数据
            if (response.data && response.data.book) {
                const book = response.data.book;
                console.log("\n=== 书籍阅读详细信息 ===>");
                // 阅读进度
                console.log(`progress (阅读进度): ${book.progress}%`);
                // 阅读状态
                console.log(`isStartReading (是否开始阅读): ${book.isStartReading === 1 ? "是(1)" : "否(0)"}`);
                // 阅读时长
                if (book.readingTime) {
                    const readingTimeMinutes = Math.round(book.readingTime / 60);
                    const readingTimeHours = (book.readingTime / 3600).toFixed(1);
                    console.log(`readingTime (阅读总时长): ${book.readingTime}秒 (${readingTimeMinutes}分钟，约${readingTimeHours}小时)`);
                }
                else {
                    console.log(`readingTime (阅读总时长): 0秒`);
                }
                // 开始阅读时间
                if (book.startReadingTime) {
                    const startDate = new Date(book.startReadingTime * 1000);
                    console.log(`startReadingTime (首次阅读时间): ${book.startReadingTime} (${startDate.toLocaleString()})`);
                }
                else {
                    console.log(`startReadingTime (首次阅读时间): 未记录`);
                }
                // 完成阅读时间
                if (book.finishTime) {
                    const finishDate = new Date(book.finishTime * 1000);
                    console.log(`finishTime (完成阅读时间): ${book.finishTime} (${finishDate.toLocaleString()})`);
                }
                else {
                    console.log(`finishTime (完成阅读时间): 未记录`);
                }
                // 当前阅读位置信息
                if (book.chapterUid) {
                    console.log(`chapterUid (当前章节ID): ${book.chapterUid}`);
                    console.log(`chapterIdx (当前章节索引): ${book.chapterIdx || "N/A"}`);
                    console.log(`chapterOffset (章节内偏移量): ${book.chapterOffset || "N/A"}`);
                }
                // 当前阅读位置摘要
                if (book.summary) {
                    console.log(`summary (当前阅读位置摘要): "${book.summary}"`);
                }
                // 更新时间
                if (book.updateTime) {
                    const updateDate = new Date(book.updateTime * 1000);
                    console.log(`updateTime (最后更新时间): ${book.updateTime} (${updateDate.toLocaleString()})`);
                }
                console.log("<== 书籍阅读详细信息 ===\n");
            }
            else {
                console.log(`未找到阅读进度数据`);
            }
            return response.data;
        }
        catch (error) {
            console.error(`获取书籍阅读进度失败:`, error.message);
            if (error.response) {
                console.error(`响应状态: ${error.response.status}`);
                console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
            }
            return null;
        }
    });
}
