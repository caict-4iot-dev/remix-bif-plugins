## 项目简介

这是星火链网 Remix 插件仓库，目前有三个插件，操作文档如下

- [Solidity 编译器](apps/solidity-compiler/README.md)
- [Solidity 部署与调用](apps/udapp/README.md)
- [JS 部署与调用](apps/udapp-js/README.md)

## 开发环境

```bash
// 安装依赖
yarn

// 启动开发环境
yarn serve:solidity
yarn serve:udapp
yarn serve:udapp-js
```

开发环境启动后，打开 Remix IDE ，点击左下角进入插件管理，点击`连接本地插件`，然后输入插件名称和 Url。
![Alt text](imgs/connect-local-plugin.png)

各插件的名称和 Url 如下

- Solidity 编译器：`bif-solidity`，`http://localhost:3001`
- Solidity 部署与调用：`bif-udapp`，`http://localhost:3002`
- JS 部署与调用：`bif-udapp-js`，`http://localhost:3004`

## 生成环境

可将三个插件部署在一个前端服务下，通过路径来区分；也可部署三个前端服务，通过域名来区分。

**一个前端服务**

```bash
// 构建生产环境
yarn build:all
```

生产环境构建成功后，各插件的静态文件目录如下

- `dist/apps`

将该目录上传到服务器，然后配置 nginx 。nginx 配置示例如下

- [nginx.conf](./nginx.conf)

**三个前端服务**

```bash
// 构建生产环境
yarn build:solidity
yarn build:udapp
yarn build:udapp-js
```

生产环境构建成功后，各插件的静态文件目录如下

- Solidity 编译器：`dist/apps/solidity-compiler`
- Solidity 部署与调用：`dist/apps/udapp`
- JS 部署与调用：`dist/apps/udapp-js`

将这些目录上传到服务器，然后配置 nginx 。nginx 配置示例如下

- [Solidity 编译器](apps/solidity-compiler/nginx.conf)
- [Solidity 部署与调用](apps/udapp/nginx.conf)
- [JS 部署与调用](apps/udapp-js/nginx.conf)

## 提交插件

如果想在 Remix 官方站点使用这些插件，需要向 Remix 提交插件信息，可参考[别人提交的 PR](https://github.com/ethereum/remix-plugins-directory/pulls)

各插件信息如下

```json
[
  {
    "description": "编译星火链网的 solidity 合约",
    "displayName": "星火链网 Solidity 编译器",
    "events": [],
    "icon": "https://bif.remix-project.cn/solidity-compiler/assets/img/bif-solidity.webp",
    "location": "sidePanel",
    "methods": [],
    "name": "bif-solidity",
    "url": "https://bif.remix-project.cn/solidity-compiler/",
    "repo": "https://github.com/caict-4iot-dev/remix-bif-plugins",
    "documentation": "https://github.com/caict-4iot-dev/remix-bif-plugins/blob/main/apps/solidity-compiler/README.md",
    "maintainedBy": "caict-4iot-dev"
  },
  {
    "description": "部署、调用星火链网的 solidity 合约",
    "displayName": "星火链网 Solidity 合约部署与调用",
    "events": [],
    "icon": "https://bif.remix-project.cn/udapp/assets/img/bif-udapp.webp",
    "location": "sidePanel",
    "methods": [],
    "name": "bif-udapp",
    "url": "https://bif.remix-project.cn/udapp/",
    "repo": "https://github.com/caict-4iot-dev/remix-bif-plugins",
    "documentation": "https://github.com/caict-4iot-dev/remix-bif-plugins/blob/main/apps/udapp/README.md",
    "maintainedBy": "caict-4iot-dev"
  },
  {
    "description": "部署、调用星火链网的 js 合约",
    "displayName": "星火链网 JS 合约部署与调用",
    "events": [],
    "icon": "https://bif.remix-project.cn/udapp-js/assets/img/bif-udapp-js.webp",
    "location": "sidePanel",
    "methods": [],
    "name": "bif-udapp-js",
    "url": "https://bif.remix-project.cn/udapp-js/",
    "repo": "https://github.com/caict-4iot-dev/remix-bif-plugins",
    "documentation": "https://github.com/caict-4iot-dev/remix-bif-plugins/blob/main/apps/udapp-js/README.md",
    "maintainedBy": "caict-4iot-dev"
  }
]
```
