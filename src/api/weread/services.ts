/**
 * 微信读书API服务模块
 */

import axios from "axios";
import {
  WEREAD_BASE_URL,
  NOTEBOOK_API,
  BOOKMARKS_API,
  BOOKSHELF_URL,
  BOOK_INFO_URL,
  BOOK_PROGRESS_API,
  BOOK_THOUGHTS_API,
} from "../../config/constants";
import { getHeaders, getHighlightHeaders } from "../../utils/http";
import { updateCookieFromResponse } from "../../utils/cookie";
import {
  ShelfBook,
  NotebookBook,
  BookInfo,
  RawHighlightsData,
  RawThoughtsData,
  BookProgressInfo,
} from "./models";
import { getBookProgress } from "./book-progress";

// 重新导出getBookProgress函数
export { getBookProgress };

/**
 * 刷新微信读书会话
 */
export async function refreshSession(currentCookie: string): Promise<string> {
  console.log("正在刷新微信读书会话...");

  // 需要按顺序访问的页面
  const urlsToVisit = [
    `${WEREAD_BASE_URL}/`, // 首页
    `${WEREAD_BASE_URL}/web/shelf`, // 书架页
  ];

  let updatedCookie = currentCookie;

  for (const url of urlsToVisit) {
    try {
      console.log(`访问: ${url}`);
      const headers = {
        ...getHeaders(updatedCookie),
        Referer: "https://weread.qq.com/",
      };

      const response = await axios.get(url, {
        headers,
        maxRedirects: 5,
      });

      // 检查是否有新Cookie
      if (response.headers["set-cookie"]) {
        const newCookies = response.headers["set-cookie"];
        console.log("服务端返回了新的Cookie");
        // 更新Cookie
        updatedCookie = updateCookieFromResponse(updatedCookie, newCookies);
      }

      // 休眠300ms，模拟真实浏览行为
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error: any) {
      console.error(`访问${url}失败:`, error.message);
    }
  }

  return updatedCookie;
}

/**
 * 从微信读书笔记本获取书籍列表
 */
export async function getNotebookBooks(
  cookie: string,
  isRetry: boolean = false
): Promise<any[]> {
  console.log("\n=== 从微信读书笔记本获取书籍列表 ===");
  console.log("API URL:", NOTEBOOK_API);

  try {
    // 设置请求头
    const headers = getHeaders(cookie);

    const response = await axios.get(NOTEBOOK_API, { headers });

    // 检查是否登录超时
    if (response.data.errCode === -2012) {
      if (isRetry) {
        throw new Error(
          "登录状态已失效，自动刷新失败。请重新获取新的 Cookie 并更新配置。"
        );
      }
      console.log("检测到登录超时，正在重新刷新会话...");
      const newCookie = await refreshSession(cookie);
      // 重新发起请求
      return getNotebookBooks(newCookie, true);
    }

    if (response.data.books && response.data.books.length > 0) {
      console.log(`笔记本中共有 ${response.data.books.length} 本书`);
      return response.data.books;
    } else if (response.data.errCode) {
      console.error(
        `API错误: ${response.data.errCode} - ${response.data.errMsg}`
      );
      return [];
    } else {
      console.log("笔记本中没有书籍");
      return [];
    }
  } catch (error: any) {
    console.error("请求失败:", error.message);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", error.response.data);
    }
    return [];
  }
}

/**
 * 从微信读书书架获取书籍列表
 */
export async function getBookshelfBooks(
  cookie: string,
  isRetry: boolean = false
): Promise<any[]> {
  console.log("\n=== 从微信读书书架获取书籍列表 ===");
  console.log("API URL:", BOOKSHELF_URL);

  try {
    // 设置请求头
    const headers = getHeaders(cookie);

    const response = await axios.get(BOOKSHELF_URL, { headers });

    // 检查是否登录超时
    if (response.data.errCode === -2012) {
      if (isRetry) {
        throw new Error(
          "登录状态已失效，自动刷新失败。请重新获取新的 Cookie 并更新配置。"
        );
      }
      console.log("检测到登录超时，正在重新刷新会话...");
      const newCookie = await refreshSession(cookie);
      // 重新发起请求
      return getBookshelfBooks(newCookie, true);
    }

    if (response.data.books && response.data.books.length > 0) {
      console.log(`书架中共有 ${response.data.books.length} 本书`);
      return response.data.books;
    } else if (response.data.errCode) {
      console.error(
        `API错误: ${response.data.errCode} - ${response.data.errMsg}`
      );
      return [];
    } else {
      console.log("书架中没有书籍");
      return [];
    }
  } catch (error: any) {
    console.error("请求失败:", error.message);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", error.response.data);
    }
    return [];
  }
}

/**
 * 获取书籍的详细信息
 */
export async function getBookInfo(
  cookie: string,
  bookId: string,
  isRetry: boolean = false
): Promise<any> {
  console.log(`获取书籍(ID: ${bookId})的详细信息...`);
  const url = `${BOOK_INFO_URL}?bookId=${bookId}`;

  try {
    // 设置请求头
    const headers = getHeaders(cookie);

    const response = await axios.get(url, { headers });

    // 检查是否登录超时
    if (response.data.errCode === -2012) {
      if (isRetry) {
        throw new Error(
          "登录状态已失效，自动刷新失败。请重新获取新的 Cookie 并更新配置。"
        );
      }
      console.log("检测到登录超时，正在重新刷新会话...");
      const newCookie = await refreshSession(cookie);
      // 重新发起请求
      return getBookInfo(newCookie, bookId, true);
    }

    return response.data;
  } catch (error: any) {
    console.error(`获取书籍信息失败:`, error.message);
    return null;
  }
}

/**
 * 获取书籍的划线数据
 */
export async function getBookHighlights(
  cookie: string,
  bookId: string,
  synckey: string = "0",
  isRetry: boolean = false
): Promise<RawHighlightsData | null> {
  console.log(`\n获取书籍(ID: ${bookId})的划线...`);
  const url = `${BOOKMARKS_API}?bookId=${bookId}&synckey=${synckey}`;

  try {
    // 设置请求头，使用特殊的划线请求头
    const headers = getHighlightHeaders(cookie, bookId);

    console.log(`发送请求到: ${url} 使用synckey: ${synckey}`);
    const response = await axios.get(url, { headers });

    // 检查是否登录超时
    if (response.data.errCode === -2012) {
      if (isRetry) {
        throw new Error(
          "登录状态已失效，自动刷新失败。请重新获取新的 Cookie 并更新配置。"
        );
      }
      console.log("检测到登录超时，正在重新刷新会话...");
      const newCookie = await refreshSession(cookie);
      // 重新发起请求
      return getBookHighlights(newCookie, bookId, synckey, true);
    }

    // 检查响应数据
    if (response.data) {
      if (response.data.synckey) {
        console.log(`获取到新的highlightsSynckey: ${response.data.synckey}`);
      }

      if (response.data.updated && response.data.updated.length > 0) {
        console.log(`找到 ${response.data.updated.length} 条新的划线记录`);
      } else if (response.data.chapters && response.data.chapters.length > 0) {
        console.log(`找到 ${response.data.chapters.length} 个章节数据`);
      } else {
        console.log(`未找到新的划线数据`);
      }
    }

    return response.data;
  } catch (error: any) {
    console.error(`获取书籍划线失败:`, error.message);
    if (error.response) {
      console.error(`响应状态: ${error.response.status}`);
      console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`请求失败，无响应数据`);
    }
    return null;
  }
}

/**
 * 获取书籍的想法数据
 */
export async function getBookThoughts(
  cookie: string,
  bookId: string,
  synckey: string = "0",
  isRetry: boolean = false
): Promise<RawThoughtsData | null> {
  console.log(`\n获取书籍(ID: ${bookId})的想法...`);
  const url = `${BOOK_THOUGHTS_API}?bookId=${bookId}&listType=11&mine=1&synckey=${synckey}`;

  try {
    // 设置请求头
    const headers = getHighlightHeaders(cookie, bookId);

    console.log(`发送请求到: ${url} 使用synckey: ${synckey}`);
    const response = await axios.get(url, { headers });

    // 检查是否登录超时
    if (response.data.errCode === -2012) {
      if (isRetry) {
        throw new Error(
          "登录状态已失效，自动刷新失败。请重新获取新的 Cookie 并更新配置。"
        );
      }
      console.log("检测到登录超时，正在重新刷新会话...");
      const newCookie = await refreshSession(cookie);
      // 重新发起请求
      return getBookThoughts(newCookie, bookId, synckey, true);
    }

    // 检查响应数据
    if (response.data.reviews && response.data.reviews.length > 0) {
      console.log(`找到 ${response.data.reviews.length} 条想法`);
    } else if (response.data.errCode) {
      console.error(
        `API错误: ${response.data.errCode} - ${
          response.data.errMsg || "未知错误"
        }`
      );
      return null;
    } else {
      console.log("未获取到任何新的想法数据");
    }

    // 检查是否有新的synckey
    if (response.data.synckey) {
      console.log(`获取到新的thoughtsSynckey: ${response.data.synckey}`);
    }

    return response.data;
  } catch (error: any) {
    console.error(`获取书籍想法失败:`, error.message);
    if (error.response) {
      console.error(`响应状态: ${error.response.status}`);
      console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}
