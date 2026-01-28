"use strict";
/**
 * 数据格式化处理模块
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookHighlightsFormatted = getBookHighlightsFormatted;
exports.getBookThoughtsFormatted = getBookThoughtsFormatted;
exports.enhanceBookMetadata = enhanceBookMetadata;
const client_1 = require("../api/weread/client");
const services_1 = require("../api/weread/services");
/**
 * 获取并格式化书籍的划线数据
 */
function getBookHighlightsFormatted(cookie_1, bookId_1) {
    return __awaiter(this, arguments, void 0, function* (cookie, bookId, useIncremental = true) {
        console.log(`\n获取书籍(ID: ${bookId})的划线数据...`);
        const wereadClient = new client_1.WeReadClient(cookie);
        return yield wereadClient.getHighlights(bookId, useIncremental);
    });
}
/**
 * 获取并格式化书籍的想法数据
 */
function getBookThoughtsFormatted(cookie_1, bookId_1) {
    return __awaiter(this, arguments, void 0, function* (cookie, bookId, useIncremental = true) {
        console.log(`\n获取书籍(ID: ${bookId})的想法数据...`);
        const wereadClient = new client_1.WeReadClient(cookie);
        return yield wereadClient.getThoughts(bookId, useIncremental);
    });
}
/**
 * 增强书籍元数据
 * 合并从书架和笔记本获取的书籍数据
 */
function enhanceBookMetadata(cookie, shelfBooks, notebookBooks) {
    return __awaiter(this, void 0, void 0, function* () {
        // 创建书籍映射表，以bookId为键
        const bookMap = new Map();
        // 首先添加书架中的书籍
        for (const book of shelfBooks) {
            bookMap.set(book.bookId, Object.assign(Object.assign({}, book), { source: ["shelf"], 
                // 保留旧的状态字段，但后续会被更新
                finishReadingStatus: book.finishReading ? "已读完" : "未读完" }));
        }
        // 然后添加或合并笔记本中的书籍数据
        for (const nbBook of notebookBooks) {
            const bookId = nbBook.bookId;
            if (bookMap.has(bookId)) {
                // 如果书架中已有该书，合并数据
                const existingBook = bookMap.get(bookId);
                bookMap.set(bookId, Object.assign(Object.assign(Object.assign({}, existingBook), nbBook.book), { hasHighlights: true, highlightCount: nbBook.marksCount || 0, source: [...existingBook.source, "notebook"] }));
            }
            else {
                // 如果书架中没有，直接添加
                bookMap.set(bookId, Object.assign(Object.assign({}, nbBook.book), { bookId: nbBook.bookId, hasHighlights: true, highlightCount: nbBook.marksCount || 0, source: ["notebook"], finishReadingStatus: "未读完" }));
            }
        }
        // 转换为数组
        const mergedBooks = Array.from(bookMap.values());
        console.log(`初步合并后共有 ${mergedBooks.length} 本书`);
        // 获取每本书的阅读进度信息
        console.log("\n正在获取阅读进度信息...");
        for (let i = 0; i < mergedBooks.length; i++) {
            const book = mergedBooks[i];
            console.log(`[${i + 1}/${mergedBooks.length}] 获取《${book.title}》的阅读进度...`);
            // 获取阅读进度
            try {
                const progressInfo = yield (0, services_1.getBookProgress)(cookie, book.bookId);
                if (progressInfo && progressInfo.book) {
                    // 使用阅读进度API的信息更新书籍状态
                    const progress = progressInfo.book.progress || 0;
                    const isStarted = progressInfo.book.isStartReading === 1;
                    const isFinished = progress >= 100;
                    // 更新阅读状态
                    if (isFinished) {
                        book.finishReadingStatus = "✅已读";
                    }
                    else if (isStarted) {
                        book.finishReadingStatus = `📖在读`;
                        book.progress = progress; // 保存进度百分比，使用与API一致的字段名
                    }
                    else {
                        book.finishReadingStatus = "📕未读";
                    }
                    // 输出阅读状态摘要
                    console.log(`\n《${book.title}》阅读状态摘要:`);
                    console.log(`- 阅读进度: ${progress}%`);
                    console.log(`- 状态: ${book.finishReadingStatus}`);
                    if (progressInfo.book.readingTime) {
                        const readingTimeMinutes = Math.round(progressInfo.book.readingTime / 60);
                        console.log(`- 阅读时长: ${readingTimeMinutes}分钟`);
                    }
                    if (progressInfo.book.startReadingTime) {
                        const startDate = new Date(progressInfo.book.startReadingTime * 1000);
                        console.log(`- 开始阅读: ${startDate.toLocaleString()}`);
                    }
                    if (progressInfo.book.finishTime) {
                        const finishDate = new Date(progressInfo.book.finishTime * 1000);
                        console.log(`- 完成阅读: ${finishDate.toLocaleString()}`);
                    }
                    // 保存额外的阅读信息以便后续扩展功能
                    book.progressData = {
                        progress: progress,
                        isStartReading: isStarted,
                        readingTime: progressInfo.book.readingTime,
                        startReadingTime: progressInfo.book.startReadingTime,
                        finishTime: progressInfo.book.finishTime,
                        updateTime: progressInfo.book.updateTime
                    };
                }
            }
            catch (error) {
                console.error(`获取《${book.title}》阅读进度失败: ${error.message}`);
                // 如果获取失败，使用默认的状态
            }
        }
        console.log(`共处理 ${mergedBooks.length} 本书的阅读进度信息`);
        return mergedBooks;
    });
}
