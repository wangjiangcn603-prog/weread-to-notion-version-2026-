# Notion API 2025-09-03 升级技术评估与实施报告

## 1. 概述
本报告旨在评估 `weread-to-notion` 项目对 Notion API 2025-09-03 版本的兼容性，并记录已实施的升级改造方案。此次升级的核心变化引入了“数据源（Data Sources）”概念，以支持更广泛的数据集成场景，要求在多数数据库操作中用 `data_source_id` 替换原有的 `database_id`。

## 2. 影响分析 (Impact Analysis)

根据 Notion 官方升级指南，主要影响如下：

### 2.1 核心变更
- **ID 机制变更**：在创建页面（Create Page）和查询数据库（Query Database）等操作中，不再直接使用 `database_id` 作为父容器标识，而是必须使用 `data_source_id`。
- **端点变更**：
  - 查询数据库内容：由 `POST /v1/databases/{id}/query` 变更为 `POST /v1/data_sources/{id}/query`。
  - 获取数据库属性：需通过 `GET /v1/data_sources/{id}` 获取。
- **获取 Data Source ID**：原有的 `Retrieve a database` 接口 (`GET /v1/databases/{id}`) 现在返回该数据库关联的 `data_sources` 列表，需从中提取 `id`。

### 2.2 受影响模块
经过代码审计，以下模块受到影响：
- **`src/config/constants.ts`**: API 版本常量需更新。
- **`src/api/notion/services.ts`**: 
  - `checkDatabaseProperties`: 需改用 Data Source API。
  - `checkBookExistsInNotion`: 需改用 Data Source Query API。
  - `writeBookToNotion`: 创建页面时 `parent` 对象需改为 `{ "data_source_id": "..." }`。
- **`src/api/notion/config-service.ts`**: 配置加载和初始化逻辑需适配新 API。

## 3. 可行性评估 (Feasibility Assessment)

### 3.1 方案对比
- **方案 A：现有代码适配 (推荐)**
  - **优势**：保留现有业务逻辑和项目结构；工作量主要集中在 API 交互层；风险可控。
  - **劣势**：需引入额外的 ID 解析逻辑。
- **方案 B：重写**
  - **优势**：可利用新 SDK 特性（如有）。
  - **劣势**：成本高昂，现有业务逻辑需重新验证。

### 3.2 结论
现有代码结构清晰（TypeScript 模块化），API 调用封装在独立的服务层中。通过适配修改即可完全满足新版 API 要求，**无需重写**。

## 4. 实施路径与已完成工作 (Implementation)

已按照“适配修改”方案完成了全量代码升级，具体步骤如下：

### 4.1 全局配置更新
- 在 `src/config/constants.ts` 中将 `NOTION_VERSION` 更新为 `2025-09-03`。

### 4.2 核心服务层改造 (`src/api/notion/services.ts`)
1.  **新增 `getDataSourceId` 辅助函数**：
    -   实现从 `database_id` 获取 `data_source_id` 的逻辑。
    -   增加了内存缓存 (`dataSourceIdCache`) 以减少 API 调用次数，优化性能。
2.  **更新 `checkDatabaseProperties`**：
    -   调用 `getDataSourceId` 解析 ID。
    -   端点迁移至 `GET /v1/data_sources/{id}`。
3.  **更新 `checkBookExistsInNotion`**：
    -   调用 `getDataSourceId` 解析 ID。
    -   端点迁移至 `POST /v1/data_sources/{id}/query`。
4.  **更新 `writeBookToNotion`**：
    -   在创建页面请求体中，将 `parent` 字段由 `{ "database_id": ... }` 修改为 `{ "data_source_id": ... }`。

### 4.3 配置服务层改造 (`src/api/notion/config-service.ts`)
- 同步更新了 `loadLibraryConfig`、`createDefaultSyncConfig` 等函数，确保配置文件的读写操作同样兼容新版 API。

## 5. 验证结果
- **编译检查**：项目已通过 TypeScript 编译 (`npm run build`)，无类型错误或语法错误。
- **逻辑验证**：代码已包含完整的 ID 解析和错误处理逻辑。

## 6. 后续建议
- 建议用户在初次运行时关注日志输出，确认 `data_source_id` 解析正常。
- 如遇 Notion API 进一步变更，需关注 `getDataSourceId` 中返回的 `results` 结构。
