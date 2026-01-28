/**
 * 配置数据库服务
 * 用于读取和管理图书馆配置数据库
 */

import axios from "axios";
import { NOTION_VERSION } from "../../config/constants";
import { getDataSourceId } from "./services";
import {
  LibraryConfig,
  ConfigDatabaseResponse,
  ConfigDatabasePage,
} from "../../config/types";

/**
 * 读取配置数据库中的"同步配置"页面
 */
export async function loadLibraryConfig(
  apiKey: string,
  configDatabaseId: string
): Promise<LibraryConfig> {
  try {
    console.log("正在读取图书馆配置...");

    // 获取 data_source_id
    const dataSourceId = await getDataSourceId(apiKey, configDatabaseId);

    // 查询配置数据库，查找名称为"同步配置"的页面
    const response = await axios.post(
      `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
      {
        filter: {
          property: "名称",
          title: {
            equals: "同步配置",
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
      }
    );

    const data: ConfigDatabaseResponse = response.data;

    if (data.results.length === 0) {
      console.log("未找到'同步配置'页面，使用默认配置（同步所有状态）");
      return {
        enabledReadingStatus: ["已读", "在读", "未读"],
        enabledAuthors: [], // 空数组表示不限制作者
      };
    }

    // 获取第一个匹配的配置页面
    const configPage = data.results[0];
    const readingStatusOptions = configPage.properties.阅读状态.multi_select;
    const authorOptions = configPage.properties.作者.multi_select;
    const syncModeOption = configPage.properties["全量/增量"]?.select?.name;
    const organizeByChapterOption =
      configPage.properties["按章节划线"]?.select?.name;

    // 提取选中的阅读状态
    const enabledReadingStatus = readingStatusOptions.map(
      (option) => option.name
    );

    // 提取选中的作者
    const enabledAuthors = authorOptions.map((option) => option.name);

    console.log(
      `配置加载成功，启用的阅读状态: ${enabledReadingStatus.join(", ")}`
    );
    console.log(
      `配置加载成功，启用的作者: ${
        enabledAuthors.length > 0 ? enabledAuthors.join(", ") : "无限制"
      }`
    );
    if (syncModeOption) {
      console.log(`配置加载成功，同步模式: ${syncModeOption}`);
    }
    if (organizeByChapterOption) {
      console.log(`配置加载成功，按章节划线: ${organizeByChapterOption}`);
    }

    return {
      enabledReadingStatus,
      enabledAuthors,
      syncMode: syncModeOption === "全量" ? "全量" : "增量", // 没有字段时默认增量
      organizeByChapter: organizeByChapterOption === "是" ? "是" : "否", // 默认否
    };
  } catch (error: any) {
    console.error("读取配置数据库失败:", error.message);
    console.log("使用默认配置（同步所有状态）");

    // 出错时返回默认配置
    return {
      enabledReadingStatus: ["已读", "在读", "未读"],
      enabledAuthors: [], // 空数组表示不限制作者
    };
  }
}

/**
 * 创建默认的同步配置页面
 */
export async function createDefaultSyncConfig(
  apiKey: string,
  configDatabaseId: string
): Promise<boolean> {
  try {
    console.log("正在创建默认同步配置...");

    const response = await axios.post(
      "https://api.notion.com/v1/pages",
      {
        parent: {
          database_id: configDatabaseId,
        },
        properties: {
          名称: {
            title: [
              {
                text: {
                  content: "同步配置",
                },
              },
            ],
          },
          阅读状态: {
            multi_select: [{ name: "已读" }, { name: "在读" }],
          },
          "全量/增量": {
            select: { name: "增量" },
          },
          按章节划线: {
            select: { name: "否" },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    );

    console.log("默认同步配置创建成功");
    return true;
  } catch (error: any) {
    console.error("创建默认配置失败:", error.message);
    return false;
  }
}

/**
 * 检查配置数据库是否存在同步配置
 */
export async function checkSyncConfigExists(
  apiKey: string,
  configDatabaseId: string
): Promise<boolean> {
  try {
    // 获取 data_source_id
    const dataSourceId = await getDataSourceId(apiKey, configDatabaseId);

    const response = await axios.post(
      `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
      {
        filter: {
          property: "名称",
          title: {
            equals: "同步配置",
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
      }
    );

    const data: ConfigDatabaseResponse = response.data;
    return data.results.length > 0;
  } catch (error: any) {
    console.error("检查配置存在性失败:", error.message);
    return false;
  }
}
