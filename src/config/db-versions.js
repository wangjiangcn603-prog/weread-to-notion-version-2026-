"use strict";
/**
 * 数据库版本控制文件
 * 在每次更改Notion数据库结构时更新此文件
 * 理论上只更改CURRENT_DB_VERSION后就可以进行全量同步
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUIRED_DB_PROPERTIES = exports.DB_MIGRATIONS = exports.CURRENT_DB_VERSION = void 0;
// 当前数据库版本号，更改数据库结构时递增
exports.CURRENT_DB_VERSION = 3;
// 数据库版本变更历史记录
exports.DB_MIGRATIONS = {
    1: "初始版本 - 包含阅读状态、开始阅读、完成阅读、阅读总时长和阅读进度字段",
    2: "增强版本 - 添加了更准确的阅读进度追踪",
    3: "元数据版本 - 添加ISBN和出版社字段支持",
};
// 数据库必要字段列表（用于检测数据库是否包含必要字段）
exports.REQUIRED_DB_PROPERTIES = [
    "书名",
    "作者",
    "阅读状态",
    "开始阅读",
    "完成阅读",
    "阅读总时长",
    "阅读进度",
    "ISBN",
    "出版社",
];
