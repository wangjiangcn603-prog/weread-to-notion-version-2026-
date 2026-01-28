"use strict";
/**
 * 微信读书客户端封装
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
exports.WeReadClient = void 0;
const services_1 = require("./services");
const cookie_1 = require("../../utils/cookie");
const file_1 = require("../../utils/file");
/**
 * 微信读书客户端类
 */
class WeReadClient {
    /**
     * 构造函数
     */
    constructor(cookie) {
        // 优先使用传入的cookie，否则获取浏览器cookie
        this.cookie = cookie || (0, cookie_1.getBrowserCookie)();
    }
    /**
     * 刷新Cookie
     */
    refreshCookie() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cookie = yield (0, services_1.refreshSession)(this.cookie);
            return this.cookie;
        });
    }
    /**
     * 获取当前Cookie
     */
    getCookie() {
        return this.cookie;
    }
    /**
     * 获取笔记本中的书籍列表
     */
    getUserNotebooks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const books = yield (0, services_1.getNotebookBooks)(this.cookie);
                // 处理登录超时等情况，这些应该已经在getNotebookBooks中处理过了
                return books;
            }
            catch (error) {
                console.error("获取笔记本书籍列表失败:", error.message);
                return [];
            }
        });
    }
    /**
     * 获取书架中的书籍列表
     */
    getBookshelf() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const books = yield (0, services_1.getBookshelfBooks)(this.cookie);
                // 处理登录超时等情况，这些应该已经在getBookshelfBooks中处理过了
                return books;
            }
            catch (error) {
                console.error("获取书架书籍列表失败:", error.message);
                return [];
            }
        });
    }
    /**
     * 获取书籍详情
     */
    getBookInfo(bookId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, services_1.getBookInfo)(this.cookie, bookId);
            }
            catch (error) {
                console.error(`获取书籍信息失败:`, error.message);
                return null;
            }
        });
    }
    /**
     * 获取划线数据并格式化
     * 使用增量同步模式
     */
    getHighlights(bookId_1) {
        return __awaiter(this, arguments, void 0, function* (bookId, useIncremental = true) {
            try {
                // 获取同步状态
                const syncState = useIncremental
                    ? (0, file_1.getSyncState)(bookId)
                    : { highlightsSynckey: "0" };
                console.log(`使用${useIncremental ? "增量" : "全量"}同步模式，highlightsSynckey: ${syncState.highlightsSynckey}`);
                // 获取原始划线数据
                let bookData = yield (0, services_1.getBookHighlights)(this.cookie, bookId, syncState.highlightsSynckey);
                // 如果没有获取到数据，重新刷新cookie并尝试
                if (!bookData && syncState.highlightsSynckey !== "0") {
                    console.log("未能获取到划线数据，尝试使用全量同步");
                    yield this.refreshCookie();
                    bookData = yield (0, services_1.getBookHighlights)(this.cookie, bookId, "0");
                }
                const formattedHighlights = [];
                let bookInfo = null;
                let newSynckey = syncState.highlightsSynckey;
                let hasUpdate = false;
                if (bookData) {
                    // 更新synckey
                    if (bookData.synckey) {
                        hasUpdate = bookData.synckey !== syncState.highlightsSynckey;
                        newSynckey = bookData.synckey;
                    }
                    // 保存书籍信息
                    bookInfo = bookData.book || null;
                    // 格式化划线数据
                    const formatted = this.formatHighlightsData(bookData);
                    formattedHighlights.push(...formatted);
                }
                return {
                    highlights: formattedHighlights,
                    bookInfo,
                    synckey: newSynckey,
                    hasUpdate,
                };
            }
            catch (error) {
                console.error(`获取划线数据失败:`, error.message);
                return {
                    highlights: [],
                    bookInfo: null,
                    synckey: "0",
                    hasUpdate: false,
                };
            }
        });
    }
    /**
     * 获取想法数据并格式化
     */
    getThoughts(bookId_1) {
        return __awaiter(this, arguments, void 0, function* (bookId, useIncremental = true) {
            try {
                // 获取同步状态
                const syncState = useIncremental
                    ? (0, file_1.getSyncState)(bookId)
                    : { thoughtsSynckey: "0" };
                console.log(`使用${useIncremental ? "增量" : "全量"}同步模式，thoughtsSynckey: ${syncState.thoughtsSynckey}`);
                // 获取原始想法数据
                let rawThoughtsData = yield (0, services_1.getBookThoughts)(this.cookie, bookId, syncState.thoughtsSynckey);
                // 如果没有获取到数据，重新刷新cookie并尝试
                if (!rawThoughtsData && syncState.thoughtsSynckey !== "0") {
                    console.log("未能获取到想法数据，尝试使用全量同步");
                    yield this.refreshCookie();
                    rawThoughtsData = yield (0, services_1.getBookThoughts)(this.cookie, bookId, "0");
                }
                const formattedThoughts = [];
                let newSynckey = syncState.thoughtsSynckey;
                let hasUpdate = false;
                if (rawThoughtsData) {
                    // 更新synckey
                    if (rawThoughtsData.synckey) {
                        hasUpdate = rawThoughtsData.synckey !== syncState.thoughtsSynckey;
                        newSynckey = rawThoughtsData.synckey;
                    }
                    // 格式化想法数据
                    const formatted = this.formatThoughtsData(rawThoughtsData);
                    formattedThoughts.push(...formatted);
                    // 如果返回了想法数据，标记为有更新
                    if (formattedThoughts.length > 0) {
                        hasUpdate = true;
                    }
                }
                return {
                    thoughts: formattedThoughts,
                    synckey: newSynckey,
                    hasUpdate,
                };
            }
            catch (error) {
                console.error(`获取想法数据失败:`, error.message);
                return {
                    thoughts: [],
                    synckey: "0",
                    hasUpdate: false,
                };
            }
        });
    }
    /**
     * 格式化划线原始数据
     */
    formatHighlightsData(bookData) {
        const formattedHighlights = [];
        try {
            if (bookData.updated && bookData.updated.length > 0) {
                console.log(`处理 ${bookData.updated.length} 条划线记录`);
                // 创建章节映射表，用于快速查找章节标题
                const chapterTitleMap = new Map();
                if (bookData.chapters && bookData.chapters.length > 0) {
                    bookData.chapters.forEach((chapter) => {
                        chapterTitleMap.set(chapter.chapterUid, chapter.title);
                    });
                    console.log(`创建章节映射表，包含 ${chapterTitleMap.size} 个章节`);
                }
                // 按章节整理划线
                const chapterMap = new Map();
                bookData.updated.forEach((highlight, index) => {
                    var _a;
                    // 获取章节ID
                    const chapterUid = highlight.chapterUid;
                    // 如果这个章节还没有划线，先创建一个数组
                    if (!chapterMap.has(chapterUid)) {
                        chapterMap.set(chapterUid, []);
                    }
                    // 处理时间格式
                    let timeStr = this.formatTimestamp(highlight.created);
                    // 从章节映射表获取正确的章节标题
                    const chapterTitle = chapterTitleMap.get(chapterUid) || `章节 ${chapterUid}`;
                    // 添加划线到对应章节
                    (_a = chapterMap.get(chapterUid)) === null || _a === void 0 ? void 0 : _a.push({
                        text: highlight.markText,
                        chapterUid: highlight.chapterUid,
                        chapterTitle: chapterTitle,
                        created: highlight.created,
                        createdTime: timeStr,
                        style: highlight.style,
                        colorStyle: highlight.colorStyle,
                        range: highlight.range,
                    });
                });
                // 将整理好的划线按章节添加到结果中
                chapterMap.forEach((highlights, chapterUid) => {
                    // 使用第一个划线的章节标题（现在已经是正确的了）
                    const chapterTitle = highlights[0].chapterTitle;
                    formattedHighlights.push({
                        chapterUid,
                        chapterTitle,
                        highlights,
                    });
                });
            }
            // 处理章节API返回的划线
            else if (bookData.chapters && bookData.chapters.length > 0) {
                console.log(`处理 ${bookData.chapters.length} 个章节API返回的数据`);
                bookData.chapters.forEach((chapter) => {
                    if (chapter.marks && chapter.marks.length > 0) {
                        const chapterHighlights = chapter.marks.map((mark) => {
                            return {
                                text: mark.markText,
                                chapterUid: chapter.chapterUid,
                                chapterTitle: chapter.title,
                                created: mark.createTime * 1000, // 转为毫秒
                                createdTime: new Date(mark.createTime * 1000).toLocaleString(),
                                range: mark.range,
                            };
                        });
                        formattedHighlights.push({
                            chapterUid: chapter.chapterUid,
                            chapterTitle: chapter.title,
                            highlights: chapterHighlights,
                        });
                    }
                });
            }
        }
        catch (error) {
            console.error(`格式化划线数据失败:`, error.message);
        }
        return formattedHighlights;
    }
    /**
     * 格式化想法原始数据
     */
    formatThoughtsData(rawThoughtsData) {
        const formattedThoughts = [];
        try {
            const rawThoughts = (rawThoughtsData === null || rawThoughtsData === void 0 ? void 0 : rawThoughtsData.reviews) || [];
            if (rawThoughts && rawThoughts.length > 0) {
                console.log(`处理 ${rawThoughts.length} 条想法数据...`);
                // 处理每条想法
                rawThoughts.forEach((thought) => {
                    // 获取嵌套的review对象中的数据
                    const review = typeof thought.review === "string"
                        ? JSON.parse(thought.review)
                        : thought.review;
                    // 如果没有review对象，尝试直接从thought对象获取数据
                    if (!review) {
                        if (thought.content || thought.abstract) {
                            formattedThoughts.push({
                                content: thought.content || "",
                                abstract: thought.abstract || "",
                                range: thought.range || "",
                                chapterUid: thought.chapterUid || 0,
                                chapterTitle: thought.chapterTitle || "未知章节",
                                createTime: thought.createTime || 0,
                                createdTime: thought.createTime
                                    ? new Date(thought.createTime * 1000).toLocaleString()
                                    : "未知时间",
                                reviewId: thought.reviewId || "",
                            });
                        }
                        return;
                    }
                    // 处理时间戳
                    const createTime = review.createTime || thought.createTime || 0;
                    let timeStr = this.formatTimestamp(createTime);
                    // 创建格式化的想法对象
                    const formattedThought = {
                        content: review.content || "",
                        abstract: review.abstract || "", // 原文
                        range: review.range || "",
                        chapterUid: review.chapterUid || thought.chapterUid || 0,
                        chapterTitle: review.chapterName ||
                            review.chapterTitle ||
                            thought.chapterTitle ||
                            "未知章节",
                        createTime,
                        createdTime: timeStr,
                        reviewId: thought.reviewId || "",
                    };
                    // 只有当有内容或原文时才添加到结果中
                    if (formattedThought.content || formattedThought.abstract) {
                        formattedThoughts.push(formattedThought);
                    }
                });
            }
        }
        catch (error) {
            console.error(`格式化想法数据失败:`, error.message);
        }
        return formattedThoughts;
    }
    /**
     * 格式化时间戳为本地时间字符串
     */
    formatTimestamp(timestamp) {
        if (!timestamp)
            return "未知时间";
        try {
            // 确保timestamp是数字类型
            const ts = typeof timestamp === "number" ? timestamp : parseInt(timestamp);
            if (isNaN(ts))
                return "未知时间";
            // 判断是毫秒还是秒级时间戳
            const date = ts > 9999999999 ? new Date(ts) : new Date(ts * 1000);
            return date.toLocaleString();
        }
        catch (error) {
            console.log(`时间格式错误: ${timestamp}`);
            return "未知时间";
        }
    }
}
exports.WeReadClient = WeReadClient;
