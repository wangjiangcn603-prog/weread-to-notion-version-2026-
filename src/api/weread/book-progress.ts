/**
 * 获取书籍阅读进度信息
 */
import axios from "axios";
import { BOOK_PROGRESS_API } from "../../config/constants";
import { getHeaders } from "../../utils/http";
import { BookProgressInfo } from "./models";
import { refreshSession } from "./services";

export async function getBookProgress(
  cookie: string,
  bookId: string,
  isRetry: boolean = false
): Promise<BookProgressInfo | null> {
  console.log(`\n获取书籍(ID: ${bookId})的阅读进度...`);
  const url = `${BOOK_PROGRESS_API}?bookId=${bookId}`;

  try {
    // 设置请求头
    const headers = getHeaders(cookie);

    console.log(`发送请求到: ${url}`);
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
      return getBookProgress(newCookie, bookId, true);
    }

    // 检查响应数据
    if (response.data && response.data.book) {
      const book = response.data.book;
      console.log("\n=== 书籍阅读详细信息 ===>");
      // 阅读进度
      console.log(`progress (阅读进度): ${book.progress}%`);

      // 阅读状态
      console.log(
        `isStartReading (是否开始阅读): ${
          book.isStartReading === 1 ? "是(1)" : "否(0)"
        }`
      );

      // 阅读时长
      if (book.readingTime) {
        const readingTimeMinutes = Math.round(book.readingTime / 60);
        const readingTimeHours = (book.readingTime / 3600).toFixed(1);
        console.log(
          `readingTime (阅读总时长): ${book.readingTime}秒 (${readingTimeMinutes}分钟，约${readingTimeHours}小时)`
        );
      } else {
        console.log(`readingTime (阅读总时长): 0秒`);
      }

      // 开始阅读时间
      if (book.startReadingTime) {
        const startDate = new Date(book.startReadingTime * 1000);
        console.log(
          `startReadingTime (首次阅读时间): ${
            book.startReadingTime
          } (${startDate.toLocaleString()})`
        );
      } else {
        console.log(`startReadingTime (首次阅读时间): 未记录`);
      }

      // 完成阅读时间
      if (book.finishTime) {
        const finishDate = new Date(book.finishTime * 1000);
        console.log(
          `finishTime (完成阅读时间): ${
            book.finishTime
          } (${finishDate.toLocaleString()})`
        );
      } else {
        console.log(`finishTime (完成阅读时间): 未记录`);
      }

      // 当前阅读位置信息
      if (book.chapterUid) {
        console.log(`chapterUid (当前章节ID): ${book.chapterUid}`);
        console.log(`chapterIdx (当前章节索引): ${book.chapterIdx || "N/A"}`);
        console.log(
          `chapterOffset (章节内偏移量): ${book.chapterOffset || "N/A"}`
        );
      }

      // 当前阅读位置摘要
      if (book.summary) {
        console.log(`summary (当前阅读位置摘要): "${book.summary}"`);
      }

      // 更新时间
      if (book.updateTime) {
        const updateDate = new Date(book.updateTime * 1000);
        console.log(
          `updateTime (最后更新时间): ${
            book.updateTime
          } (${updateDate.toLocaleString()})`
        );
      }

      console.log("<== 书籍阅读详细信息 ===\n");
    } else {
      console.log(`未找到阅读进度数据`);
    }

    return response.data;
  } catch (error: any) {
    console.error(`获取书籍阅读进度失败:`, error.message);
    if (error.response) {
      console.error(`响应状态: ${error.response.status}`);
      console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}
