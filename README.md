# APITable Widget - RepeatDelete (重复项合并删除工具)

本项目是一个为 [AITable (维格表)](https://aitable.ai/) 开发的自定义小程序（Widget）。主要用于在表内快速筛选出重复条目，并将重复的多行数据智能合并为一行，最后自动删除多余的重复记录。

## 🌟 功能特性

- **灵活判断重复条件**：提供下拉菜单指定用来判断重复的字段（默认自动选择表格第一列）。
- **直观的重复项列表与数据预览**：点击“查找重复项”后，分组展示所有重复项的信息，并在下方直观展示**合并后的数据预览**。
- **快捷的组选择操作**：
  - 列表左侧多选框每次勾选代表选中该重复值下的**所有关联记录**。
  - 拥有 **全选**、**反选**、**取消选择** 按钮批量操作。
- **智能的合并策略**：
  - **单选、单行文字、多行文字等**：以最后编辑的有效数据为准。
  - **多选、成员、链接引用字段、附件字段**：将该组内所有记录内容合并去重，保留所有的唯一值。

## 🚀 开发与部署说明

请参考 AITable 官方的 [小程序快速入门指南](https://developers.aitable.ai/widget/quick-start)。

### 1. 环境准备

确保你的本地环境已安装 [Node.js](https://nodejs.org/) 以及包管理工具 (`npm` 或 `yarn`)。

全局安装官方的小程序开发工具（Widget CLI）：

```bash
npm install -g @apitable/widget-cli
```

### 2. 身份认证与初始化

为了授权发布并在开发时读取你的工作空间，你需要进行身份认证：

```bash
widget-cli init
```

*如果你还没有 API Token，请前往 AITable 的“用户中心 -> 开发者配置”界面生成一个 API Token，然后将其粘贴到命令行中。*

### 3. 安装依赖

克隆项目后，在根目录执行以下命令：

```bash
npm install
# 或者
yarn install
```

### 4. 启动本地开发与预览

要在本地开发小程序并即时预览效果，执行：

```bash
npm start
# 或直接执行：
widget-cli start
```

此时，进入你的 AITable 工作区，打开某张维格表，点击右上角「小程序」，进入小程序中心，选择基于本地开发模式建立的小程序，就可以开始调试和使用这个合并工具了。

*(如果你在 Chrome M118 及更高版本中遇到本地资源无法加载的问题，可以在浏览器通过 `chrome://flags/#temporary-unexpire-flags-m118` 放行 `allow-insecure-localhost` 或手动访问一次本地资源。详见官方文档)*

### 5. 发布小程序

开发和测试验证完成后，按照以下步骤发布给团队内其他成员使用：

1. 准备一张 64*64 的 png 图片，替换项目根目录的 `package_icon.png`。
2. 修改 `widget.config.json` 中的 `name` 和 `description` 属性。
3. 退出 `start` 开发模式（`Ctrl + C`）后，运行以下指令发布：

```bash
npm run release
# 或使用：
widget-cli release
```

*如果你使用的是私有部署或社区版，还需要配置上传的资源服务器地址：`widget-cli release --uploadHost <host>`。*

发布成功后，你即可在工作区的小程序中心“自定义”分类下找到并使用这款工具。

## 📝 贡献与定制

该小程序核心逻辑主要位于 `src/utils.ts` 中，展示层位于 `src/index.tsx`。你可根据自身需要定制数据合并规则。

## 📄 开源许可证

本项目基于 [MIT License](./LICENSE) 开源。
