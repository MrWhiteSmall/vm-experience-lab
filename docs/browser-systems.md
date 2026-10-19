# 浏览器系统接入记录

2026-10-19 补充。此文件记录项目实际选用的 x86 镜像，与前期 ARM64 候选调研分开。内存是分配给客户系统的配置，不是官方最低值，也不是整个浏览器的主机内存占用。

| 系统 | 镜像落盘 | 本次内存 | 体验重点 | 入口 |
|---|---:|---:|---|---|
| KolibriOS 0.7.7.0 | 1,474,560 B / 1.41 MiB | 64 MiB | 汇编微型图形系统 | 桌面小工具 |
| Tiny Core 16.2 | 25,165,824 B / 24 MiB | 256 MiB | RAM 中运行、极简图形桌面 | 终端 uname -a |
| FreeDOS 1.4 LiteUSB | 33,554,432 B / 32 MiB | 32 MiB | 经典 DOS 命令行 | 自动退出安装器；VER、DIR、HELP |
| SliTaz 5.0-RC4 / 20260525 | 61,849,600 B / 58.98 MiB | 512 MiB | Openbox 轻量桌面 | 文件管理器、终端 |
| Alpine 3.24.2 virt x86 | 51,380,224 B / 49 MiB | 256 MiB | musl、BusyBox、OpenRC | root 登录，无密码 |

五个镜像落盘合计 165.39 MiB；从 Alpine ISO 原样提取的启动文件额外占 15.10 MiB，合计约 180.49 MiB，不含固件和 v86。一次只运行一个系统；换盘前会明确确认结束旧会话。客户系统磁盘和内存不持久保存，刷新、弹出、换盘会丢失修改。未配置外网，因此包管理器不能在线安装，浏览器应用也不能访问互联网。

## FreeDOS

发行入口：https://www.freedos.org/download/

官方分发 ZIP：https://www.ibiblio.org/pub/micro/pc-stuff/freedos/files/distributions/1.4/FD14-LiteUSB.zip

发行说明与校验：https://www.ibiblio.org/pub/micro/pc-stuff/freedos/files/distributions/1.4/readme.txt 、同目录 verify.txt。

ZIP 为 17,671,175 B / 16.85 MiB。ZIP SHA-256：`857dcd2ebf9d3d094320154db5fb5b830acba6fb98f981a95a0ca7ab3350338b`。

使用 ZIP 中的原始 FD14LITE.img，SHA-256：`f539d456b792594bc3ca59d4e0f4c23d4f1fee73370c1390b2da245400718d36`。接作临时硬盘，优先从硬盘引导。识别语言菜单后选择 English，再选择 No — Return to DOS。该操作进入基础环境，不进行系统安装。LiteUSB 不包含完整发行版的所有应用或游戏。

## SliTaz

镜像与校验：https://mirror.slitaz.org/iso/rolling/slitaz-rolling.iso 、同目录 slitaz-rolling.md5。

ISO 内引导菜单标注 `5.0-RC4 20260525`，不把滚动发行版表述成新的稳定正式版。官方 MD5：`fbd81b8d800f314976e9a25a57c33ee6`；本次观测 SHA-256：`492b4d846a86443f22a2c58d50e213af9778a979bad2130d614a4efac30df7ee`。

使用原始 Live ISO，英语和美式键盘默认项。固定本次快照的大小与 SHA-256；上游路径虽可变，准备脚本不会静默接收其他构建。若未来上游替换，需重新下载、核实并更新记录。

## Alpine

镜像：https://dl-cdn.alpinelinux.org/alpine/v3.24/releases/x86/alpine-virt-3.24.2-x86.iso

官方校验为同 URL 加 `.sha256`，SHA-256：`62e752e0f674b1537a7fc38d9c3e6eab9644ae93e8610efb64756a00e7592a10`。

选择 virt x86，不使用 ARM64 或 minirootfs。通过 v86 原生 bzimage / initrd 接口直接引导，挂载同一原始 ISO 读取系统组件，ISO 不修改。启动参数为 `modules=loop,squashfs,sd-mod,usb-storage quiet console=tty0 vga=normal nomodeset`。准备脚本从校验后的 ISO 提取 boot/vmlinuz-virt（8,065,536 B）和 boot/initramfs-virt（7,766,084 B），分别校验 SHA-256 后加载；具体摘要保存在 asset-manifest.json。这避免依赖停留很短的 Syslinux 菜单。root 登录无需密码，登录后可查看 `/etc/alpine-release`、`busybox`、`rc-status`。这是命令行体验，不包含桌面。

## 继续接入的边界

Haiku 和 ReactOS 需要分别验证设备与版本兼容性；仅有可下载 ISO 不代表可以运行。deepin、openKylin 和现代 64 位系统需要另选本地虚拟化后端，不应通过修改 ready 字段接入当前 v86。前期更多系统资料保留在 catalog.csv / catalog.json。
