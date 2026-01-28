"use strict";
/**
 * 批量同步所有书籍模块
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
exports.syncAllBooks = syncAllBooks;
const formatter_1 = require("../formatter");
const book_sync_1 = require("./book-sync");
const file_1 = require("../../utils/file");
const services_1 = require("../../api/weread/services");
const services_2 = require("../../api/notion/services");
/**
 * 同步所有书籍到Notion
 */
function syncAllBooks(apiKey_1, databaseId_1, cookie_1) {
    return __awaiter(this, arguments, void 0, function* (apiKey, databaseId, cookie, useIncremental = true) {
        console.log(`\n=== 开始${useIncremental ? "增量" : "全量"}同步所有书籍 ===`);
        try {
            // 获取书架中的书籍
            const shelfBooks = yield (0, services_1.getBookshelfBooks)(cookie);
            // 获取笔记本中的书籍（有划线的书籍）
            const notebookBooks = yield (0, services_1.getNotebookBooks)(cookie);
            // 合并书籍元数据
            const mergedBooks = yield (0, formatter_1.enhanceBookMetadata)(cookie, shelfBooks, notebookBooks);
            // 过滤出有划线的书籍
            const booksToSync = mergedBooks.filter((book) => book.hasHighlights);
            console.log(`\n过滤后共有 ${booksToSync.length} 本有划线的书籍需要同步（已忽略无划线书籍）`);
            console.log(`\n准备同步 ${booksToSync.length} 本书到Notion...`);
            // --- 1. 获取Notion现有书籍并构建映射 ---
            console.log("正在获取Notion中的书籍列表...");
            const notionBooks = yield (0, services_2.getAllBooksInNotion)(apiKey, databaseId);
            // 构建映射: "标题|作者" -> PageID
            const notionBookMap = new Map();
            for (const nb of notionBooks) {
                notionBookMap.set(`${nb.title}|${nb.author}`, nb.id);
            }
            // --- 2. 处理删除逻辑 ---
            console.log("正在检查是否有需要删除的书籍...");
            const weReadBookKeys = new Set(booksToSync.map((b) => `${b.title}|${b.author || "未知作者"}`));
            let deletedCount = 0;
            for (const notionBook of notionBooks) {
                const key = `${notionBook.title}|${notionBook.author}`;
                if (!weReadBookKeys.has(key)) {
                    console.log(`书籍《${notionBook.title}》在微信读书中已不存在或无划线，准备从Notion中删除...`);
                    const archived = yield (0, services_2.archivePage)(apiKey, notionBook.id);
                    if (archived)
                        deletedCount++;
                }
            }
            if (deletedCount > 0) {
                console.log(`已删除 ${deletedCount} 本不再存在或无划线的书籍`);
            }
            else {
                console.log("没有发现需要删除的书籍");
            }
            // 同步结果统计
            let successCount = 0;
            let failCount = 0;
            let skippedCount = 0;
            // 遍历所有书籍并同步
            for (let i = 0; i < booksToSync.length; i++) {
                const book = booksToSync[i];
                console.log(`\n[${i + 1}/${booksToSync.length}] 同步《${book.title}》...`);
                // 检查书籍是否已存在于Notion (使用本地映射，减少API调用)
                const key = `${book.title}|${book.author || "未知作者"}`;
                const existingPageId = notionBookMap.get(key);
                const exists = !!existingPageId;
                let finalPageId;
                // 获取书籍详细信息（无论是否存在都需要，用于更新属性）
                console.log(`获取《${book.title}》的详细信息...`);
                const detailedBookInfo = yield (0, services_1.getBookInfo)(cookie, book.bookId);
                // 合并详细信息到书籍数据中
                const enhancedBook = Object.assign(Object.assign({}, book), { 
                    // 优先使用详细API返回的信息
                    isbn: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.isbn) || book.isbn || "", publisher: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.publisher) || book.publisher || "", 
                    // 其他可能的详细信息也可以在这里添加
                    intro: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.intro) || book.intro || "", publishTime: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.publishTime) || book.publishTime || "", 
                    // 确保阅读进度数据是最新的
                    finishReading: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.finishReading) || book.finishReading });
                if (exists && existingPageId) {
                    console.log(`《${book.title}》已存在于Notion，将更新现有记录（包括阅读状态）`);
                    yield (0, services_2.updateBookProperties)(apiKey, existingPageId, enhancedBook);
                    finalPageId = existingPageId;
                }
                else {
                    console.log(`获取到ISBN: ${enhancedBook.isbn}, 出版社: ${enhancedBook.publisher}`);
                    // 写入书籍元数据到Notion
                    const writeResult = yield (0, services_2.writeBookToNotion)(apiKey, databaseId, enhancedBook);
                    if (!writeResult.success || !writeResult.pageId) {
                        failCount++;
                        console.log(`《${book.title}》同步失败`);
                        continue; // 跳过此书继续处理下一本
                    }
                    finalPageId = writeResult.pageId;
                }
                // 同步书籍内容
                const syncContentResult = yield (0, book_sync_1.syncBookContent)(apiKey, databaseId, cookie, book.bookId, finalPageId, book, useIncremental, false // 默认不按章节组织
                );
                // 检查是否有真正的更新
                const hasUpdates = syncContentResult.hasUpdate || !useIncremental;
                if (!hasUpdates) {
                    console.log(`《${book.title}》没有检测到新内容，跳过同步`);
                    skippedCount++;
                    continue; // 跳过此书继续处理下一本
                }
                // 保存同步状态（无论增量还是全量同步都需要保存，以便下次增量同步使用）
                const syncState = {
                    bookId: book.bookId,
                    lastSyncTime: Date.now(),
                    highlightsSynckey: syncContentResult.highlightsSynckey,
                    thoughtsSynckey: syncContentResult.thoughtsSynckey,
                };
                (0, file_1.saveSyncState)(syncState);
                console.log(`已保存同步状态，highlightsSynckey: ${syncContentResult.highlightsSynckey}, thoughtsSynckey: ${syncContentResult.thoughtsSynckey}`);
                if (syncContentResult.success) {
                    console.log(`《${book.title}》同步成功`);
                    successCount++;
                }
                else {
                    console.log(`《${book.title}》基本信息同步成功，但内容同步失败`);
                    failCount++;
                }
                // 添加延迟，避免请求过快
                yield new Promise((resolve) => setTimeout(resolve, 1000));
            }
            console.log("\n=== 同步完成 ===");
            console.log(`成功: ${successCount} 本，失败: ${failCount} 本，跳过(无更新): ${skippedCount} 本`);
        }
        catch (error) {
            console.error("同步过程中发生错误:", error.message);
        }
    });
}
