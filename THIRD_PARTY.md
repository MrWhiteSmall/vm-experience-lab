# 第三方组件与镜像

本项目只在本机准备并运行资源。系统与固件下载不纳入 Git；后续若分发构建产物，应同时处理相应上游许可、版权声明与源码提供义务。

| 资源 | 来源 | 许可/说明 |
|---|---|---|
| v86 0.5.471 | https://github.com/copy/v86 ，npm `v86` | BSD-2-Clause；准备时复制上游 LICENSE 到 public/vendor/v86/ |
| Fraunces 可变字体（Latin WOFF2） | https://github.com/google/fonts/tree/main/ofl/fraunces ，通过 Fontsource/jsDelivr 获取 | SIL Open Font License 1.1；许可随项目保存在 public/fonts/OFL-Fraunces.txt |
| SeaBIOS 固件 | v86 仓库 bios/seabios.bin；上游 https://www.seabios.org/ | LGPLv3 等；具体以 SeaBIOS 上游许可和源码为准 |
| VGA BIOS | v86 仓库 bios/vgabios.bin；源码来源见 https://github.com/copy/v86/tree/master/bios | LGPL 系列；以对应上游源码及许可为准 |
| KolibriOS 0.7.7.0-9234-gd5a7ef67e en_US IMG | https://kolibrios.org/en/download 及其官方 builds.kolibrios.org 链接 | KolibriOS 内核及各应用遵循各自许可证；源码 https://git.kolibrios.org/KolibriOS/kolibrios |
| Tiny Core 16.2 ISO | http://tinycorelinux.net/16.x/x86/release/TinyCore-16.2.iso | 由 Linux 内核、BusyBox、图形组件等组成，分别遵循各自开源许可；源码与许可说明以 http://tinycorelinux.net/ 为准 |

`scripts/prepare-assets.mjs` 记录每个下载产物的精确 URL、字节数与 SHA-256。KolibriOS IMG 另与官方下载页给出的 SHA-256 比对；Tiny Core 本轮校验预期体积并记录内容 SHA-256，未宣称具备独立官方 SHA-256 签名验证。

deepin、openKylin、Haiku 等名称仅用于说明对应系统。界面没有打包这些系统的商标图片或系统镜像。所有名称的相关权利归其各自权利人。
