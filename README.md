# YouTube Channel Saver

一个用于收藏 YouTube 频道的 Chrome 扩展。可按分类管理频道，在弹窗或独立收藏页中搜索和浏览，并支持 JSON 导入/导出备份。

## 功能

- 在 YouTube 频道页的频道操作区添加“收藏频道”按钮；视频页也可从频道订阅操作区收藏。
- 收藏时选择已有分类，或即时新建分类。
- 工具栏弹窗支持搜索、移除收藏和深色/浅色主题切换。
- 收藏库支持分类筛选、搜索、分类调整和 JSON 备份恢复。
- 数据保存在当前 Chrome 配置的扩展本地存储中。

## 安装

请按 [`INSTALL.md`](INSTALL.md) 操作。此版本用于 Chrome 开发者模式手动安装，尚未发布到 Chrome Web Store。

如果要创建 GitHub 仓库并上传，请看 [`GITHUB_UPLOAD.md`](GITHUB_UPLOAD.md)。安装步骤的截图在 `docs/tutorial/` 中。

## 收藏数据备份

Chrome 在卸载扩展时会清除扩展本地数据。卸载或更换浏览器配置前，请打开收藏库，使用“导出备份”保存 JSON；重新安装后使用“导入备份”恢复。

## 发布到 GitHub

可以把整个项目目录（包括 `assets/`）上传为 GitHub 仓库。发布 GitHub Release 时，可附上随项目交付的 `youtube-channel-saver-v1.0.0.zip`。下载后需先解压，再在 Chrome 中加载解压后的文件夹；GitHub 仓库本身不会自动把扩展安装到 Chrome。

## 兼容性说明

YouTube 会调整频道页结构。扩展会尝试把按钮放在“加入”或订阅操作旁边；如果频道布局没有可识别的操作区，按钮可能不会显示。YouTube 页面更新后，可能需要更新扩展适配逻辑。
