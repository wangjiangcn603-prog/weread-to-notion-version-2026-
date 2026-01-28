"use strict";
/**
 * 文件操作工具
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncStateFilePath = getSyncStateFilePath;
exports.getSyncState = getSyncState;
exports.saveSyncState = saveSyncState;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const constants_1 = require("../config/constants");
/**
 * 获取同步状态文件路径
 */
function getSyncStateFilePath(bookId) {
    return path.join(constants_1.SYNC_STATE_DIR, `${bookId}.json`);
}
/**
 * 获取书籍的同步状态
 */
function getSyncState(bookId) {
    try {
        // 确保目录存在
        if (!fs.existsSync(constants_1.SYNC_STATE_DIR)) {
            fs.mkdirSync(constants_1.SYNC_STATE_DIR, { recursive: true });
        }
        const filePath = getSyncStateFilePath(bookId);
        if (fs.existsSync(filePath)) {
            const state = JSON.parse(fs.readFileSync(filePath, "utf8"));
            // 添加验证，确保同步时间不是未来时间
            const now = Date.now();
            if (state.lastSyncTime > now) {
                console.warn(`检测到未来的同步时间 ${new Date(state.lastSyncTime).toLocaleString()}，重置为当前时间`);
                state.lastSyncTime = 0; // 重置为0以强制全量同步
                state.highlightsSynckey = "0";
                state.thoughtsSynckey = "0";
            }
            console.log(`已加载书籍 ${bookId} 的同步状态: 上次同步时间 ${new Date(state.lastSyncTime).toLocaleString()}`);
            return state;
        }
    }
    catch (error) {
        console.error(`获取同步状态失败:`, error);
    }
    // 返回默认状态
    return {
        bookId,
        lastSyncTime: 0,
        highlightsSynckey: "0",
        thoughtsSynckey: "0",
    };
}
/**
 * 保存书籍的同步状态
 */
function saveSyncState(state) {
    try {
        // 确保目录存在
        if (!fs.existsSync(constants_1.SYNC_STATE_DIR)) {
            fs.mkdirSync(constants_1.SYNC_STATE_DIR, { recursive: true });
        }
        const filePath = getSyncStateFilePath(state.bookId);
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
        console.log(`已保存书籍 ${state.bookId} 的同步状态: 同步时间 ${new Date(state.lastSyncTime).toLocaleString()}`);
    }
    catch (error) {
        console.error(`保存同步状态失败:`, error);
    }
}
