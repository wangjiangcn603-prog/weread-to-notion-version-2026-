"use strict";
/**
 * 配置功能测试脚本
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
const dotenv_1 = __importDefault(require("dotenv"));
const config_service_1 = require("./api/notion/config-service");
// 加载环境变量
dotenv_1.default.config({ path: ".env" });
function testConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== 配置功能测试 ===");
            // 获取环境变量
            const NOTION_API_KEY = process.env.NOTION_INTEGRATIONS;
            const CONFIG_DATABASE_ID = process.env.CONFIG_DATABASE_ID;
            if (!NOTION_API_KEY) {
                console.error("错误: 缺少 NOTION_INTEGRATIONS 环境变量");
                return;
            }
            if (!CONFIG_DATABASE_ID) {
                console.error("错误: 缺少 CONFIG_DATABASE_ID 环境变量");
                console.log("请在 .env 文件中设置 CONFIG_DATABASE_ID");
                return;
            }
            console.log(`配置数据库ID: ${CONFIG_DATABASE_ID}`);
            // 1. 检查配置是否存在
            console.log("\n1. 检查同步配置是否存在...");
            const configExists = yield (0, config_service_1.checkSyncConfigExists)(NOTION_API_KEY, CONFIG_DATABASE_ID);
            console.log(`配置存在: ${configExists}`);
            // 2. 如果不存在，创建默认配置
            if (!configExists) {
                console.log("\n2. 创建默认同步配置...");
                const created = yield (0, config_service_1.createDefaultSyncConfig)(NOTION_API_KEY, CONFIG_DATABASE_ID);
                console.log(`配置创建结果: ${created}`);
            }
            // 3. 加载配置
            console.log("\n3. 加载配置...");
            const config = yield (0, config_service_1.loadLibraryConfig)(NOTION_API_KEY, CONFIG_DATABASE_ID);
            console.log("当前配置:", config);
            console.log("\n=== 测试完成 ===");
            console.log("如果一切正常，您可以在Notion配置数据库中修改'同步配置'页面的'阅读状态'字段来控制同步规则");
        }
        catch (error) {
            console.error("测试失败:", error.message);
        }
    });
}
// 运行测试
testConfig().catch((error) => {
    console.error("测试执行失败:", error);
});
