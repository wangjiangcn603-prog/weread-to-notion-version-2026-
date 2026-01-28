"use strict";
/**
 * 数据库迁移工具
 * 用于检测数据库版本并执行必要的迁移操作
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndMigrateIfNeeded = checkAndMigrateIfNeeded;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_versions_1 = require("../config/db-versions");
const constants_1 = require("../config/constants");
const services_1 = require("../api/notion/services");
/**
 * 从文件中获取当前数据库版本
 */
function getCurrentDbVersionFromFile() {
    const versionFilePath = path_1.default.join(constants_1.SYNC_STATE_DIR, 'db-version.json');
    if (!fs_1.default.existsSync(versionFilePath)) {
        return 0; // 如果文件不存在，返回0表示未初始化
    }
    try {
        const versionData = JSON.parse(fs_1.default.readFileSync(versionFilePath, 'utf8'));
        return versionData.version || 0;
    }
    catch (error) {
        console.error('读取数据库版本文件失败:', error);
        return 0;
    }
}
/**
 * 保存数据库版本到文件
 */
function saveDbVersionToFile(version) {
    const versionFilePath = path_1.default.join(constants_1.SYNC_STATE_DIR, 'db-version.json');
    // 确保目录存在
    if (!fs_1.default.existsSync(constants_1.SYNC_STATE_DIR)) {
        fs_1.default.mkdirSync(constants_1.SYNC_STATE_DIR, { recursive: true });
    }
    try {
        fs_1.default.writeFileSync(versionFilePath, JSON.stringify({ version, updatedAt: new Date().toISOString() }));
        console.log(`已保存数据库版本: ${version}`);
    }
    catch (error) {
        console.error('保存数据库版本文件失败:', error);
    }
}
/**
 * 清除所有同步状态
 */
function clearSyncState() {
    if (!fs_1.default.existsSync(constants_1.SYNC_STATE_DIR)) {
        return;
    }
    try {
        const files = fs_1.default.readdirSync(constants_1.SYNC_STATE_DIR);
        for (const file of files) {
            // 保留版本文件，删除其他同步状态文件
            if (file !== 'db-version.json') {
                fs_1.default.unlinkSync(path_1.default.join(constants_1.SYNC_STATE_DIR, file));
            }
        }
        console.log('已清除所有同步状态');
    }
    catch (error) {
        console.error('清除同步状态失败:', error);
    }
}
/**
 * 检查是否需要迁移，并执行必要的迁移操作
 * @returns true表示需要执行全量同步，false表示不需要
 */
function checkAndMigrateIfNeeded(apiKey, databaseId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('正在检查数据库版本...');
        // 获取当前保存的版本
        const currentVersion = getCurrentDbVersionFromFile();
        // 检查数据库是否包含所有必要字段
        const missingProperties = yield (0, services_1.checkDatabaseProperties)(apiKey, databaseId, db_versions_1.REQUIRED_DB_PROPERTIES);
        // 如果版本过旧或缺少必要字段，执行迁移
        if (currentVersion < db_versions_1.CURRENT_DB_VERSION || missingProperties.length > 0) {
            console.log('\n===== 检测到数据库需要升级 =====');
            if (currentVersion < db_versions_1.CURRENT_DB_VERSION) {
                console.log(`当前版本: ${currentVersion} → 目标版本: ${db_versions_1.CURRENT_DB_VERSION}`);
            }
            if (missingProperties.length > 0) {
                console.log(`缺少必要字段: ${missingProperties.join(', ')}`);
                console.log('请确保您的Notion数据库包含所有必要字段，可参考最新的模板');
            }
            console.log('\n正在准备迁移...');
            // 清除所有同步状态，以便进行全量同步
            clearSyncState();
            // 更新版本号
            saveDbVersionToFile(db_versions_1.CURRENT_DB_VERSION);
            console.log('\n迁移准备完成，将执行全量同步以更新所有数据\n');
            return true;
        }
        console.log(`数据库版本检查通过，当前版本: ${currentVersion}`);
        return false;
    });
}
