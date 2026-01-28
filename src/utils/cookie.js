"use strict";
/**
 * Cookie处理工具
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowserCookie = getBrowserCookie;
exports.updateCookieFromResponse = updateCookieFromResponse;
/**
 * 获取微信读书Cookie
 */
function getBrowserCookie() {
    // 从环境变量中获取Cookie
    if (process.env.WEREAD_COOKIE) {
        console.log("从环境变量中获取Cookie");
        return process.env.WEREAD_COOKIE;
    }
    // 如果环境变量中没有设置，提示用户正确配置
    console.error("错误: 未设置 WEREAD_COOKIE 环境变量，请在 .env 文件中设置您的微信读书 Cookie");
    console.error("提示: 您可以复制 env.example 文件为 .env 并在其中填入您的 Cookie");
    process.exit(1); // 退出程序
    return ""; // 这行代码永远不会执行，但需要返回值以满足TypeScript类型检查
}
/**
 * 合并新旧Cookie
 */
function updateCookieFromResponse(currentCookie, setCookieHeaders) {
    // 解析当前Cookie
    const cookiePairs = currentCookie.split(";").map((pair) => {
        const [name, value] = pair.trim().split("=");
        return { name, value };
    });
    // 解析返回的Set-Cookie头
    for (const setCookie of setCookieHeaders) {
        const cookiePart = setCookie.split(";")[0]; // 只取第一部分，忽略expires等
        const [name, value] = cookiePart.trim().split("=");
        if (name && value) {
            // 查找并更新或添加
            const existingIndex = cookiePairs.findIndex((c) => c.name === name);
            if (existingIndex >= 0) {
                cookiePairs[existingIndex].value = value;
            }
            else {
                cookiePairs.push({ name, value });
            }
        }
    }
    // 重新构建Cookie字符串
    return cookiePairs.map((c) => `${c.name}=${c.value}`).join("; ");
}
