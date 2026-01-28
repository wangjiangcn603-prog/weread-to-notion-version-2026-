"use strict";
/**
 * 书籍过滤器
 * 根据配置过滤要同步的书籍
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterBooksByConfig = filterBooksByConfig;
exports.showFilterStats = showFilterStats;
/**
 * 根据阅读状态字符串映射状态类型
 */
function mapReadingStatusFromString(finishReadingStatus) {
    if (finishReadingStatus === null || finishReadingStatus === void 0 ? void 0 : finishReadingStatus.includes("已读")) {
        return "已读";
    }
    else if (finishReadingStatus === null || finishReadingStatus === void 0 ? void 0 : finishReadingStatus.includes("在读")) {
        return "在读";
    }
    else {
        return "未读";
    }
}
/**
 * 根据配置过滤书籍列表
 */
function filterBooksByConfig(books, config) {
    console.log(`\n=== 开始过滤书籍 ===`);
    console.log(`总书籍数量: ${books.length}`);
    console.log(`启用的阅读状态: ${config.enabledReadingStatus.join(", ")}`);
    console.log(`启用的作者: ${config.enabledAuthors.length > 0
        ? config.enabledAuthors.join(", ")
        : "无限制"}`);
    const filteredBooks = books.filter((book) => {
        const bookStatus = mapReadingStatusFromString(book.finishReadingStatus);
        const bookAuthor = book.author || "";
        // 检查该书的阅读状态是否在启用列表中
        const statusMatches = config.enabledReadingStatus.includes(bookStatus);
        // 检查该书的作者是否在启用列表中（如果配置了作者过滤）
        const authorMatches = config.enabledAuthors.length === 0 ||
            config.enabledAuthors.includes(bookAuthor);
        const shouldSync = statusMatches && authorMatches;
        if (!shouldSync) {
            const reason = [];
            if (!statusMatches)
                reason.push(`状态: ${bookStatus}`);
            if (!authorMatches)
                reason.push(`作者: ${bookAuthor}`);
            console.log(`跳过书籍《${book.title}》- ${reason.join(", ")}`);
        }
        return shouldSync;
    });
    console.log(`过滤后书籍数量: ${filteredBooks.length}`);
    console.log(`=== 书籍过滤完成 ===\n`);
    return filteredBooks;
}
/**
 * 显示过滤统计信息
 */
function showFilterStats(allBooks, filteredBooks, config) {
    const stats = {
        总数: allBooks.length,
        已读: 0,
        在读: 0,
        未读: 0,
        同步数量: filteredBooks.length,
    };
    // 统计各状态书籍数量
    const authorStats = new Map();
    allBooks.forEach((book) => {
        const status = mapReadingStatusFromString(book.finishReadingStatus);
        if (status === "已读")
            stats.已读++;
        else if (status === "在读")
            stats.在读++;
        else
            stats.未读++;
        // 统计作者分布
        const author = book.author || "未知作者";
        authorStats.set(author, (authorStats.get(author) || 0) + 1);
    });
    console.log("\n=== 书籍同步统计 ===");
    console.log(`书架总书籍: ${stats.总数} 本`);
    console.log(`  - 已读: ${stats.已读} 本`);
    console.log(`  - 在读: ${stats.在读} 本`);
    console.log(`  - 未读: ${stats.未读} 本`);
    // 显示作者统计（如果有作者过滤配置）
    if (config.enabledAuthors.length > 0) {
        console.log(`作者分布:`);
        const sortedAuthors = Array.from(authorStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // 只显示前5个
        sortedAuthors.forEach(([author, count]) => {
            const isEnabled = config.enabledAuthors.includes(author);
            console.log(`  - ${author}: ${count} 本 ${isEnabled ? "✓" : "✗"}`);
        });
    }
    console.log(`配置的同步状态: ${config.enabledReadingStatus.join(", ")}`);
    console.log(`配置的同步作者: ${config.enabledAuthors.length > 0
        ? config.enabledAuthors.join(", ")
        : "无限制"}`);
    console.log(`将要同步: ${stats.同步数量} 本书籍`);
    console.log("==================\n");
}
