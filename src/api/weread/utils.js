"use strict";
/**
 * 微信读书API工具函数
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
exports.makeRequest = makeRequest;
exports.formatTimestamp = formatTimestamp;
const axios_1 = __importDefault(require("axios"));
/**
 * 创建带有超时和重试能力的API请求
 * @param url 请求URL
 * @param options 请求选项
 * @param maxRetries 最大重试次数
 * @returns 响应数据
 */
function makeRequest(url_1, options_1) {
    return __awaiter(this, arguments, void 0, function* (url, options, maxRetries = 3) {
        var _a;
        let lastError = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // 为GET请求添加时间戳避免缓存
                if (((_a = options.method) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'get') {
                    options.params = Object.assign(Object.assign({}, options.params), { _: new Date().getTime() });
                }
                const response = yield (0, axios_1.default)(url, Object.assign({ timeout: 30000 }, options));
                // 检查返回的错误码
                if (response.data.errcode !== undefined && response.data.errcode !== 0) {
                    throw new Error(`API错误: ${response.data.errmsg || '未知错误'} (code: ${response.data.errcode})`);
                }
                return response.data;
            }
            catch (error) {
                lastError = error;
                console.error(`请求失败 (尝试 ${attempt + 1}/${maxRetries}):`, error.message);
                // 最后一次尝试失败则抛出异常
                if (attempt === maxRetries - 1) {
                    throw error;
                }
                // 等待一定时间后重试 (增加随机时间避免同时请求)
                const delay = 1000 * (attempt + 1) + Math.random() * 1000;
                yield new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError || new Error('所有请求尝试都失败');
    });
}
/**
 * 格式化时间戳为可读日期
 * @param timestamp 时间戳(秒)
 * @returns 格式化的日期字符串 YYYY-MM-DD HH:mm:ss
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19);
}
