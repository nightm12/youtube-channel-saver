# 上传到 GitHub

当前文件夹已经是一个本地 Git 项目，包含扩展源码和三张安装教程截图。上传到 GitHub 仍需使用你自己的 GitHub 账号。

## 通过 GitHub Desktop

1. 安装并登录 GitHub Desktop。
2. 选择 **File → Add Local Repository**，选择本文件夹。
3. 如果它提示该文件夹不是 Git 仓库，先不要继续；本项目已初始化 Git，通常不会出现此提示。
4. 在 Changes 页面确认文件列表后，写入提交说明 `Initial commit`，点击 **Commit to main**。
5. 点击 **Publish repository**，输入仓库名称 `youtube-channel-saver`，按需要选择 Public 或 Private，然后发布。

## 通过命令行

在本文件夹打开 PowerShell，执行以下命令。把 `<你的 GitHub 用户名>` 替换为账号名；GitHub 会按其登录流程验证身份，不要把密码或访问令牌发给别人。

```powershell
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<你的 GitHub 用户名>/youtube-channel-saver.git
git push -u origin main
```

先在 GitHub 创建同名空仓库，创建时不要勾选自动添加 README、`.gitignore` 或 License；然后再执行命令。

如果希望提供可下载的安装包，在仓库的 **Releases** 页面创建一个 Release，并将 `youtube-channel-saver-v1.0.0.zip` 作为附件上传。安装者下载后解压，再跟随 [`INSTALL.md`](INSTALL.md) 操作。
