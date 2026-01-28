"use strict";
/**
 * 书籍同步核心模块
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
exports.syncBookContent = syncBookContent;
exports.syncSingleBook = syncSingleBook;
const file_1 = require("../../utils/file");
const formatter_1 = require("../formatter");
const services_1 = require("../../api/notion/services");
const services_2 = require("../../api/weread/services");
/**
 * 同步书籍内容（划线和想法）到Notion
 * 确保先写入划线，再写入想法
 */
function syncBookContent(apiKey_1, databaseId_1, cookie_1, bookId_1, finalPageId_1, bookInfo_1) {
    return __awaiter(this, arguments, void 0, function* (apiKey, databaseId, cookie, bookId, finalPageId, bookInfo, useIncremental = true, organizeByChapter = false) {
        console.log(`\n=== 同步书籍内容 ===`);
        console.log(`按章节组织: ${organizeByChapter ? "是" : "否"}`);
        try {
            // 获取书籍划线数据 - 使用增量同步
            const { highlights, synckey: highlightsSynckey, hasUpdate: hasHighlightUpdate, } = yield (0, formatter_1.getBookHighlightsFormatted)(cookie, bookId, useIncremental);
            // 获取书籍想法数据 - 同样使用增量同步获取新想法
            const { thoughts, synckey: thoughtsSynckey, hasUpdate: hasThoughtUpdate, } = yield (0, formatter_1.getBookThoughtsFormatted)(cookie, bookId, useIncremental);
            // 判断是否有更新
            const hasUpdates = hasHighlightUpdate || hasThoughtUpdate || !useIncremental;
            if (!hasUpdates) {
                console.log(`《${bookInfo.title}》没有检测到新内容，跳过内容同步`);
                return {
                    success: true,
                    highlightsSynckey,
                    thoughtsSynckey,
                    hasUpdate: false,
                    highlights: [],
                    thoughts: [],
                };
            }
            // 1. 先处理划线数据
            console.log(`处理划线数据（共 ${highlights.reduce((sum, chapter) => sum + chapter.highlights.length, 0)} 条）...`);
            let highlightResult = true;
            if (hasHighlightUpdate && highlights.length > 0) {
                // 写入划线数据
                highlightResult = yield (0, services_1.writeHighlightsToNotionPage)(apiKey, finalPageId, bookInfo, highlights, organizeByChapter);
                console.log(highlightResult
                    ? `成功写入 ${highlights.reduce((sum, chapter) => sum + chapter.highlights.length, 0)} 条划线`
                    : `写入划线失败`);
            }
            else {
                console.log(`没有新的划线需要同步`);
            }
            // 2. 再处理想法数据
            console.log(`处理想法数据（共 ${thoughts.length} 条）...`);
            let thoughtResult = true;
            if (hasThoughtUpdate && thoughts.length > 0) {
                // 写入想法数据 - 传递增量更新标志和按章节组织标志
                thoughtResult = yield (0, services_1.writeThoughtsToNotionPage)(apiKey, finalPageId, bookInfo, thoughts, useIncremental, organizeByChapter);
                console.log(thoughtResult ? `成功写入 ${thoughts.length} 条想法` : `写入想法失败`);
            }
            else {
                console.log(`没有新的想法需要同步`);
            }
            // 返回同步结果和synckey
            return {
                success: highlightResult && thoughtResult,
                highlightsSynckey,
                thoughtsSynckey,
                hasUpdate: true,
                highlights,
                thoughts,
            };
        }
        catch (error) {
            console.error(`同步书籍内容失败:`, error.message);
            return {
                success: false,
                highlightsSynckey: "",
                thoughtsSynckey: "",
                hasUpdate: false,
                highlights: [],
                thoughts: [],
            };
        }
    });
}
/**
 * 同步单本书
 */
function syncSingleBook(apiKey_1, databaseId_1, cookie_1, bookId_1) {
    return __awaiter(this, arguments, void 0, function* (apiKey, databaseId, cookie, bookId, useIncremental = true, organizeByChapter = false) {
        console.log(`\n=== 开始${useIncremental ? "增量" : "全量"}同步书籍(ID: ${bookId}) ===`);
        try {
            // 获取书籍详细信息
            const bookInfo = yield (0, services_2.getBookInfo)(cookie, bookId);
            if (!bookInfo) {
                console.error(`未能获取到书籍 ${bookId} 的信息`);
                return false;
            }
            // 添加读书状态
            bookInfo.finishReadingStatus = bookInfo.finishReading ? "已读完" : "未读完";
            // 检查书籍是否已存在
            const { exists, pageId: existingPageId } = yield (0, services_1.checkBookExistsInNotion)(apiKey, databaseId, bookInfo.title, bookInfo.author);
            let finalPageId;
            if (exists && existingPageId) {
                console.log(`书籍《${bookInfo.title}》已存在，将更新现有记录`);
                finalPageId = existingPageId;
            }
            else {
                // 写入书籍元数据到Notion
                const writeResult = yield (0, services_1.writeBookToNotion)(apiKey, databaseId, bookInfo);
                if (!writeResult.success || !writeResult.pageId) {
                    console.error(`写入书籍 ${bookId} 到Notion失败`);
                    return false;
                }
                finalPageId = writeResult.pageId;
            }
            // 同步书籍内容
            const syncContentResult = yield syncBookContent(apiKey, databaseId, cookie, bookId, finalPageId, bookInfo, useIncremental, organizeByChapter);
            // 保存同步状态
            if (useIncremental) {
                const syncState = {
                    bookId,
                    lastSyncTime: Date.now(),
                    highlightsSynckey: syncContentResult.highlightsSynckey,
                    thoughtsSynckey: syncContentResult.thoughtsSynckey,
                };
                (0, file_1.saveSyncState)(syncState);
                console.log(`已保存同步状态，highlightsSynckey: ${syncContentResult.highlightsSynckey}, thoughtsSynckey: ${syncContentResult.thoughtsSynckey}`);
            }
            console.log(`书籍 ${bookId} 同步完成`);
            return true;
        }
        catch (error) {
            console.error(`同步书籍 ${bookId} 失败:`, error.message);
            return false;
        }
    });
}
