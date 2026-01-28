"use strict";
/**
 * HTTP请求工具
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeaders = getHeaders;
exports.getHighlightHeaders = getHighlightHeaders;
exports.getNotionHeaders = getNotionHeaders;
/**
 * 获取标准请求头
 */
function getHeaders(cookie) {
    return {
        Cookie: cookie,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
        Referer: "https://weread.qq.com/web/shelf",
        Origin: "https://weread.qq.com",
    };
}
/**
 * 获取微信读书划线请求头
 * 包含特定的referer和sec-*头信息
 */
function getHighlightHeaders(cookie, bookId) {
    return {
        Cookie: cookie,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        Referer: `https://weread.qq.com/web/reader/${bookId}`,
        Origin: "https://weread.qq.com",
        "sec-ch-ua": '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
    };
}
/**
 * 获取Notion API请求头
 */
function getNotionHeaders(apiKey, notionVersion) {
    return {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": notionVersion,
        "Content-Type": "application/json",
    };
}
