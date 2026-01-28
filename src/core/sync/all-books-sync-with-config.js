"use strict";
/**
 * 带配置过滤的批量同步所有书籍模块
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
exports.syncAllBooksWithConfig = syncAllBooksWithConfig;
const formatter_1 = require("../formatter");
const book_sync_1 = require("./book-sync");
const file_1 = require("../../utils/file");
const services_1 = require("../../api/weread/services");
const services_2 = require("../../api/notion/services");
const config_service_1 = require("../../api/notion/config-service");
const book_filter_1 = require("../book-filter");
/**
 * 同步所有书籍到Notion（带配置过滤）
 */
function syncAllBooksWithConfig(apiKey_1, databaseId_1, cookie_1) {
    return __awaiter(this, arguments, void 0, function* (apiKey, databaseId, cookie, useIncremental = true, configDatabaseId) {
        console.log(`\n=== 开始${useIncremental ? "增量" : "全量"}同步所有书籍（带配置过滤）===`);
        try {
            // 1. 加载同步配置
            let config = {
                enabledReadingStatus: ["已读", "在读", "未读"], // 默认同步所有状态
                enabledAuthors: [], // 默认不限制作者
            };
            if (configDatabaseId) {
                // 检查配置是否存在，如果不存在则创建默认配置
                const configExists = yield (0, config_service_1.checkSyncConfigExists)(apiKey, configDatabaseId);
                if (!configExists) {
                    console.log("配置数据库中未找到同步配置，正在创建默认配置...");
                    yield (0, config_service_1.createDefaultSyncConfig)(apiKey, configDatabaseId);
                }
                // 加载配置
                config = yield (0, config_service_1.loadLibraryConfig)(apiKey, configDatabaseId);
            }
            else {
                console.log("未提供配置数据库ID，使用默认配置（同步所有状态）");
            }
            // 新增：根据配置 syncMode 决定 useIncremental
            const useIncrementalFromConfig = config.syncMode !== "全量";
            // 新增：根据配置决定是否按章节组织
            const organizeByChapterFromConfig = config.organizeByChapter === "是";
            console.log(`同步模式: ${config.syncMode || "增量"}`);
            console.log(`按章节划线: ${config.organizeByChapter || "否"}`);
            // 2. 获取书架中的书籍
            const shelfBooks = yield (0, services_1.getBookshelfBooks)(cookie);
            // 3. 获取笔记本中的书籍（有划线的书籍）
            const notebookBooks = yield (0, services_1.getNotebookBooks)(cookie);
            // 4. 合并书籍元数据
            const allBooks = yield (0, formatter_1.enhanceBookMetadata)(cookie, shelfBooks, notebookBooks);
            // 5. 根据配置过滤书籍
            const booksToSync = (0, book_filter_1.filterBooksByConfig)(allBooks, config);
            // 6. 显示过滤统计信息
            (0, book_filter_1.showFilterStats)(allBooks, booksToSync, config);
            console.log(`\n准备同步 ${booksToSync.length} 本书到Notion...`);
            // 同步结果统计
            let successCount = 0;
            let failCount = 0;
            let skippedCount = 0;
            // 遍历所有书籍并同步
            for (let i = 0; i < booksToSync.length; i++) {
                const book = booksToSync[i];
                console.log(`\n[${i + 1}/${booksToSync.length}] 同步《${book.title}》...`);
                // 检查书籍是否已存在于Notion
                const { exists, pageId: existingPageId } = yield (0, services_2.checkBookExistsInNotion)(apiKey, databaseId, book.title, book.author);
                let finalPageId;
                if (exists && existingPageId) {
                    console.log(`《${book.title}》已存在于Notion，将更新现有记录`);
                    finalPageId = existingPageId;
                }
                else {
                    // 获取书籍详细信息（包括ISBN和出版社）
                    console.log(`获取《${book.title}》的详细信息...`);
                    const detailedBookInfo = yield (0, services_1.getBookInfo)(cookie, book.bookId);
                    // 合并详细信息到书籍数据中
                    const enhancedBook = Object.assign(Object.assign({}, book), { 
                        // 优先使用详细API返回的信息
                        isbn: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.isbn) || book.isbn || "", publisher: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.publisher) || book.publisher || "", 
                        // 其他可能的详细信息也可以在这里添加
                        intro: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.intro) || book.intro || "", publishTime: (detailedBookInfo === null || detailedBookInfo === void 0 ? void 0 : detailedBookInfo.publishTime) || book.publishTime || "" });
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
                const syncContentResult = yield (0, book_sync_1.syncBookContent)(apiKey, databaseId, cookie, book.bookId, finalPageId, book, useIncrementalFromConfig, organizeByChapterFromConfig);
                // 检查是否有真正的更新
                const hasUpdates = syncContentResult.hasUpdate || !useIncrementalFromConfig;
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
