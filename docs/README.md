# 虚拟机体验室：个人使用的系统与资源调研

调研日期：2026-10-16。目标是本人在网页中选择、启动并体验不同系统的独到之处，按单人、通常只运行一台系统设计。

本轮是资料调研和主机只读检查：覆盖 20 个系统/发行版候选，其中 15 个已核实具体下载产物的大小。没有下载 ISO/系统磁盘、安装虚拟化软件或启动客户系统。所有运行表现、安装后实际占用和建议配置仍需实测。候选目录不等于已验证可运行清单，也不是操作系统的穷尽名录。

**本机基线与影响**

| 项目 | 检查结果 | 对方案的影响 |
|---|---|---|
| 主机 | Mac mini，Apple M4 | ARM64 客户系统优先；x86 客户系统通常需要指令模拟 |
| CPU | 10 个物理/逻辑核心 | 通常从 1–2 vCPU 起，重型客户系统再分配 4 个；不能按核心数直接推算并发 |
| 内存 | 25,769,803,776 字节，即 24 GiB；系统界面显示 24 GB | 日常体验先从单台 512 MiB–4 GiB 开始；6–8 GiB 档位需观察主机工作负载 |
| 硬件虚拟化 | kern.hv_support = 1 | 可研究 QEMU HVF / Apple Virtualization.framework；当前主机不是 Linux KVM 环境 |
| 数据卷 | 显示容量 460 GiB，可用约 295 GiB | 当前具备建立小型镜像库的空间；APFS 容量与可用空间会变化 |
| 运行时快照 | swap 已用约 10.5 GiB；memory_pressure -Q 报告 free percentage 37% | swap 包含运行历史，37% 也不是可直接分配给 VM 的额度；都不能单独证明当前压力，需要运行时复测 |
| 已发现工具 | Docker Desktop 已安装；PATH 中未发现 QEMU；常用 /Applications 路径未发现 UTM/Parallels/Fusion/VirtualBuddy | “未发现”不等于全盘确认未安装；本轮没有安装或改动这些工具 |

本机数据来自 system_profiler、sysctl、df、vm_stat、memory_pressure。未将序列号、硬件 UUID 等身份信息保存到调研文件。

**资源口径：必须分开记录**

| 指标 | 含义 | 本轮状态 |
|---|---|---|
| 官方最低/推荐配置 | 项目文档中的条件；常与版本、架构、桌面、swap 有关 | 能查证的已写入目录，未提供的保留未知 |
| 安装环境的资源 | Live/图形安装器的内存，可能高于安装完成后的系统 | 大部分待实测 |
| 体验配置 | 足以完成指定体验任务的 CPU、内存和磁盘容量 | 本文仅给起始建议 |
| 下载占用 | ISO、IMG、ZIP、XZ 或 IPSW 的实际下载体积 | 15 个候选已查到具体产物大小 |
| 解压后体积 | 压缩包展开后的 ISO/磁盘映像大小 | 部分产物待核实；不能拿 ZIP 大小替代 |
| 安装后实际占用 | 系统、预装应用、更新、日志和缓存实际占用 | 全部待安装后测量 |
| 虚拟磁盘逻辑容量 | 例如配置一块 32 GiB 的稀疏磁盘 | 不等于立即占用 32 GiB |
| 宿主真实占用 | 基础盘、写入层、快照、保存状态在主机上的 allocated bytes | 待实测；内存保存状态可能额外占接近客户机内存的空间 |

GiB/MiB 采用 1024 进制。未拿到精确字节数时，保留官方目录原值的 M/G 或页面标注，避免把近似值写成精确值。

**有明确版本或镜像的 15 个候选**

| 系统 / 版本 | 值得体验的特点 | 官方资源信息与适用条件 | 核实的下载体积 | 在 M4 上的初步选择 |
|---|---|---|---|---|
| Ubuntu 26.04.1 Desktop ARM64 | GNOME 工作流、软件中心、常见桌面体验 | 官网系统要求：双核 2 GHz、6 GB RAM、25 GB 磁盘 [U1] | ISO 4,154,798,080 B，约 3.87 GiB [U2] | ARM64 本地虚拟化；从 2 vCPU / 6 GiB / 32 GiB 逻辑磁盘试起 |
| Fedora 44 Workstation aarch64 | 较新 GNOME、Fedora 软件与管理方式 | 多数变体推荐 4 GB RAM、40 GB 磁盘；不是统一最低值 [F1] | ISO 目录显示 2.5 GiB [F2] | ARM64 本地虚拟化；2 vCPU / 4 GiB / 40 GiB |
| Debian 13.7 ARM64 + Xfce | 轻桌面、APT、稳定发行版组织方式 | 无桌面 512 MB / 4 GB；桌面 1 GB / 10 GB；假设 swap、非 Live 安装 [D1] | netinst ISO 显示 701M；桌面需联网另装 [D2] | ARM64 本地虚拟化；2 vCPU / 2 GiB / 20 GiB |
| NixOS 26.05 aarch64 | 声明式配置、环境复现、系统 generation 回滚 | 手册 VirtualBox 示例为 768 MB / 10 GB 起；不能当成当前图形版的可靠最低配置 [N1] | Minimal 1.69 GiB；Graphical 3.65 GiB，均由 HTTP 头核实 [N2] | ARM64 本地虚拟化；2 vCPU / 4 GiB / 32 GiB |
| Alpine 3.24.2 aarch64 | BusyBox、musl、OpenRC、apk、小型系统结构 | wiki 默认安装至少 1 GB；其内存表自带“非 x86 数值可能是猜测”的警告，不采信为可靠 ARM64 下限 [A1] | virt ISO 89M；standard ISO 376M [A2] | ARM64 virt 镜像；1 vCPU / 512 MiB / 4 GiB 起测，先体验命令行 |
| FreeBSD 15.1 aarch64 | BSD 基础系统、rc、Ports/pkg；后续可展示 jail | 当前手册要求按架构与版本判断，未给统一内存下限 [B1] | disc1 ISO 1.115 GiB；xz 包 0.752 GiB [B2] | QEMU ARM64 候选；1 vCPU / 1 GiB / 12 GiB、UFS 起测，兼容性待验证 |
| OpenBSD 7.9 arm64 | 基础工具、手册与系统设计；可加 cwm | FAQ 提到可小至 512 MB 磁盘，但推荐新用户 8 GB 以上；ARM64 RAM 下限未确认 [O1] | install79.iso 613,474,304 B，约 585 MiB [O2] | QEMU ARM64 候选；1 vCPU / 1 GiB / 8 GiB 起测 |
| Haiku R1/beta6 x86 | BeOS 风格桌面、Tracker、文件属性与查询 | 32 位最低 Pentium II/Athlon、256 MB RAM、2 GB 磁盘；64 位推荐 2 GB RAM、16 GB 磁盘 [H1] | 32 位 anyboot ISO 约 1.38 GiB [H2] | 32 位 v86 或 QEMU x86 模拟；1 vCPU / 1 GiB / 8 GiB 起测 |
| ReactOS 0.4.16 i386 | 开源 Windows NT 兼容系统与经典桌面 | wiki 通用下限 64 MB RAM、450 MB 磁盘，推荐 256 MB；不是版本实测，系统仍为 alpha [R1] | 发行 ZIP 198.1 MB；解压 ISO 大小待核实 [R2] | v86 或 QEMU x86 模拟；1 vCPU / 512 MiB / 2 GiB |
| FreeDOS 1.4 | DOS 命令、文本工具与经典游戏 | 发行 README：DOS 兼容 BIOS 环境；基本安装 20 MB、完整安装 275 MB；未给 RAM 下限 [DOS1] | LiveCD ZIP 280M；LiteUSB ZIP 17M，内容不同 [DOS2] | v86 优先；32 MiB RAM 起测；按所需内容选启动盘 |
| KolibriOS 0.7.7.0 CI 构建 | 汇编编写的小系统、快速启动、小型图形程序 | 官网：i586、12 MB RAM、数 MB 磁盘 [K1] | 软盘 IMG 1,474,560 B；LiveCD ISO 103,759,872 B，约 99 MiB [K2] | v86 优先；64 MiB RAM 起测；软盘版应用少于 LiveCD |
| Tiny Core 16.2 x86 | 模块化扩展、RAM 中运行、极简图形桌面 | FAQ 历史值 46 MB 最低、128 MB+swap 推荐；FAQ 有旧内容，当前版本必须复测 [T1] | TinyCore ISO 24 MiB；CorePlus 274 MiB [T2] | v86 或 QEMU x86；256 MiB RAM 起测 |
| Linux Mint 22.3 Cinnamon | Cinnamon 传统桌面、系统设置与日常交互 | 最低 2 GB RAM、20 GB 磁盘；推荐 4 GB、100 GB [M1] | 下载页显示 ISO 2.9 GB [M2] | x86_64 需模拟；2 vCPU / 4 GiB / 24 GiB 是短时实验配置，磁盘低于官方推荐 |
| Arch Linux 2026.10.01 | 手动组成系统、滚动发行、pacman | 基本系统最低 512 MiB，Live 安装器需更多；基本安装小于 2 GiB，不含桌面 [AR1] | 下载页显示 ISO 1.5 GB [AR2] | x86_64 需模拟；1 vCPU / 1 GiB / 8 GiB、先体验基础系统 |
| deepin 25.2.0 ARM64 | DDE、中文交互、控制中心与系统应用 | 下载页未给可靠最低内存/磁盘；存在芯片适配说明，ARM64 不保证通用 VM 可启动 [DE1] | ISO 5,509,810,176 B，约 5.13 GiB [DE2] | 先做镜像启动兼容性验证；暂按 2 vCPU / 6 GiB / 40 GiB 规划 |

上述虚拟机配置全部是试验起点，不能解释为测得的最低值或保证流畅的配置。FreeBSD/OpenBSD 加桌面后需重新评估。NixOS 的优势需要实际安装和改配置才能体现，仅进入 Live 桌面不足以展示其差异。

**暂未锁定具体镜像的 5 类候选**

| 候选 | 已确认的事实 | 还缺什么 | 优先级 |
|---|---|---|---|
| Windows 11 Arm64 | 官方提供 Arm64 ISO；最低 4 GB RAM、64 GB 存储、兼容双核 1 GHz CPU；还有 UEFI、Secure Boot 能力、TPM 2.0 等条件 [W1][W2] | 固定版本/语言、下载大小、虚拟设备驱动、具体后端与安装占用；先按 4 vCPU / 6 GiB / 80 GiB 逻辑盘规划 | 第二批，确有 Windows 体验需求再加入 |
| macOS ARM64 | Apple 官方支持 Apple silicon 上的 macOS VM；恢复镜像是 IPSW，最低资源可从 restore configuration 读取 [AP2] | 当前 M4 支持的版本、IPSW 体积、安装占用、网页画面接入；示例 128 GB 磁盘不是最低值 | 较低，主机已经是 macOS；需要隔离环境或比较版本时再做 |
| Android | Android-x86 有 Live/安装流程 [AND1] | 选择 ARM64 AOSP Emulator 或某个 x86 发行版，再查版本资源、镜像体积和图形后端；不是任意 ARM64 镜像都能启动 | 第二批 |
| 9front / Plan 9 | 有官方发布入口；v86 列有既有演示 [P1][V1] | 固定版本、可靠最低配置、镜像字节数、启动与交互实测 | 系统设计差异大，值得第二批调查 |
| 经典 Windows 95/98/2000/XP | v86 列有 95/98/2000 等演示；这不保证任意原版 ISO 均兼容 [V1] | 逐版规格、合法镜像来源、体积；XP 单独验证 | 第二批怀旧体验 |

可继续扩展的范围包括 NetBSD、illumos/OpenIndiana、SerenityOS、AROS、RISC OS、其他 Linux 桌面与国产发行版。它们本轮没有完成版本级资源核实，不填入“已验证”候选。

**按独到之处选系统**

Ubuntu、Fedora、Mint、Debian 的桌面差异值得比较，但不能把每换一个发行版都视作完全不同的系统设计。可以在网页中注明“内核/系统家族”“发行版”“桌面环境”三个维度。

第一批适合先验证这八个：KolibriOS、Tiny Core、FreeDOS、ReactOS、Haiku、Alpine、Debian Xfce、NixOS。它们分别展示极小图形系统、模块化 RAM 系统、DOS、NT 兼容实现、BeOS 继承、轻量 Unix 用户空间、传统完整 Linux、声明式系统配置。

每个系统配置 2–3 个短任务，比单纯进入桌面更能体现特色。例如 Haiku 做文件属性查询，NixOS 改配置并回滚，Alpine 对照 BusyBox 与 OpenRC，FreeDOS 运行文本工具或自备经典程序。体验内容只占用所需资源。

**适合本机的执行方向**

网页负责系统目录、特色介绍、镜像状态、启动/停止/重置和进入画面的入口。浏览器画面接入与真实系统运行后端分别验证：

1. 小型 x86 和经典系统优先评估 v86，运算在浏览器内进行。v86 当前 README 明确缺少 64 位扩展与多核，不可拿来承诺现代 64 位 Linux/Windows 支持 [V1]。其演示列表也不构成本次所选版本的兼容性保证。
2. 现代 ARM64 Linux 优先使用宿主上的硬件虚拟化。Apple Virtualization.framework 可运行相应主机架构的 Linux，QEMU HVF 是另一条候选 [AP1]。不要为了“网页入口”先把所有完整 VM 塞进 Docker Desktop 的 Linux VM；这会引入嵌套虚拟化与设备支持变量。
3. ARM64 BSD、deepin 先验证启动链和虚拟设备。相同 CPU 架构仅解决一部分兼容性问题。
4. x86_64 独有的现代桌面使用 QEMU 指令模拟时，先测一个样本，再决定是否纳入。Rosetta 的 x86_64 用户程序翻译不能替代完整 x86 操作系统虚拟化。
5. QEMU/VNC 类后端可评估 noVNC 网页画面；Apple 原生虚拟化视图不能假设直接交给 noVNC。macOS VM 的网页操作需要另行验证相应画面/输入通道。

现阶段适合统一“入口和生命周期”，后端按系统能力选择。最终是否统一嵌入网页，要看键盘、鼠标、显示、声音和系统独有交互是否可接受。

**内存与存储的起始预算**

默认一次只开一台。轻型客户系统先限 512 MiB–2 GiB；现代桌面先按 4 GiB，Ubuntu 当前官方要求较高，按 6 GiB 另测。Windows/macOS 的 6–8 GiB 作为后续档位。硬件总内存足够容纳这些配置，并不代表当前软件负载下都能流畅运行。

第一批八个候选可先设一个约 70 GiB 的物理存储软预算：

| 用途 | 起始预算 | 性质 |
|---|---:|---|
| 下载与保留安装介质 | 10 GiB | 为第一批产物留余量；不是 20 项全部镜像总大小 |
| 安装后的基础系统盘 | 35 GiB | 宿主实际占用的规划额度，尚无实测 |
| 持久写入层、更新缓存 | 15 GiB | 尽量限制快照数量 |
| 下载/解压/安装临时空间 | 10 GiB | 需结合最坏并存情形调整 |
| 合计 | 70 GiB | 可与当前约 295 GiB 可用空间比较；不是保留、预分配或保证值 |

不需要把每台逻辑磁盘上限简单相加当成即时占用；也不能因此忽略它们后续写满的风险。跨不同发行版的系统盘通常不能共享基础层；写时复制适合同一模板的重置和多实例。

个人短时体验可以优先 Live 启动，减少安装盘；要体现 NixOS 回滚等功能时再做持久盘。无实际需求时不保存内存快照。大型系统按需下载，旧安装包可在验证恢复方式后清理。

**得到“最佳方案”之前的最小实测**

先验证一个浏览器样本（KolibriOS 或 Tiny Core）与一个 ARM64 本地样本（Debian Xfce），然后再决定网页和启动管理的实现。还不适合仅凭官方最低值固定统一架构。

每个样本记录：精确镜像版本/校验和、CPU 架构、执行后端、1–2 vCPU 起始配置、从点击到可交互的时间、空闲及任务时宿主真实内存、CPU、客户系统内存、主机内存压力与 swap 变化、实际磁盘占用、联网/离线能力、中文输入/鼠标/声音和特色任务是否通过。

分别在“主机常用软件已打开”和“相对空闲”两种状态测量。安装后再降低内存寻找体验下限，不拿“勉强启动”代替“能完成特色体验”。对于稀疏文件，同时记录逻辑大小与宿主实际分配大小；做快照前后也测量差额。

本轮结论：M4/24 GiB/约 295 GiB 可用空间具备建立个人系统体验库的条件。当前最值得验证的是浏览器小型系统与本地 ARM64 系统的组合；整体性能、真实安装占用和最终推荐配置尚无运行证据。

**文件与证据**

- catalog.csv：20 个候选的可排序目录，官方配置与建议配置分栏；未知值保留待核实。
- catalog.json：同一目录的结构化版本；精确字节数仅在证据支持时填写。
- host-baseline.json：本机非身份性基线与检查局限。
- source-urls.json：本轮访问的源地址映射。
- sources/：官方页面、项目分发镜像站索引和 HTTP 头，便于复核。HTML 中可能包含页面脚本，均仅作为文本证据，没有执行。
- 部分尝试返回 404 或超时，包括 fedora_req、fedora_req2、freebsd_images、utm_docs、haiku_faq、freedos_req、reactos_headers；这些失败内容未用作结论。旧版本索引也未用于冒充当前版本。FreeDOS 改以发行 README 和分发镜像站核实。

**来源索引**

[U1] https://ubuntu.com/download/desktop
[U2] https://cdimage.ubuntu.com/releases/26.04.1/release/ （及同目录 ubuntu-26.04.1-desktop-arm64.iso 的 HTTP 头）

[F1] https://fedoraproject.org/workstation/download/
[F2] https://download.fedoraproject.org/pub/fedora/linux/releases/44/Workstation/aarch64/iso/

[D1] https://www.debian.org/releases/stable/arm64/ch03s04.en.html
[D2] https://cdimage.debian.org/debian-cd/current/arm64/iso-cd/

[N1] https://nixos.org/manual/nixos/stable/ （Installing in a VirtualBox guest）
[N2] https://nixos.org/download/ 以及 https://channels.nixos.org/nixos-26.05/latest-nixos-minimal-aarch64-linux.iso 和 https://channels.nixos.org/nixos-26.05/latest-nixos-graphical-aarch64-linux.iso 的 HTTP 头；本轮重定向版本为 26.05.11829.a033e66ab94a。

[A1] https://wiki.alpinelinux.org/wiki/Requirements
[A2] https://dl-cdn.alpinelinux.org/alpine/latest-stable/releases/aarch64/

[B1] https://docs.freebsd.org/en/books/handbook/bsdinstall/
[B2] https://download.freebsd.org/releases/arm64/aarch64/ISO-IMAGES/15.1/

[O1] https://www.openbsd.org/faq/faq4.html 以及 https://www.openbsd.org/arm64.html
[O2] https://cdn.openbsd.org/pub/OpenBSD/7.9/arm64/

[H1] https://www.haiku-os.org/get-haiku/r1beta6/release-notes/
[H2] https://www.haiku-os.org/get-haiku/ 、 https://ftp.osuosl.org/pub/haiku/r1beta6/ 及 32 位 anyboot ISO 的 HTTP 头

[R1] https://reactos.org/wiki/Installing_ReactOS
[R2] https://reactos.org/download/ 及 https://sourceforge.net/projects/reactos/files/ReactOS/0.4.16/

[DOS1] https://www.ibiblio.org/pub/micro/pc-stuff/freedos/files/distributions/1.4/readme.txt
[DOS2] https://www.ibiblio.org/pub/micro/pc-stuff/freedos/files/distributions/1.4/

[K1] https://kolibrios.org/en/
[K2] https://kolibrios.org/en/download 及其链接的 0.7.7.0-9234-gd5a7ef67e en_US IMG/ISO 的 HTTP 头

[T1] http://www.tinycorelinux.net/faq.html
[T2] http://tinycorelinux.net/16.x/x86/release/

[M1] https://www.linuxmint.com/faq.php
[M2] https://www.linuxmint.com/edition.php?id=326

[AR1] https://wiki.archlinux.org/title/Installation_guide
[AR2] https://archlinux.org/download/

[DE1] https://www.deepin.org/en/download/
[DE2] https://cdimage.deepin.com/releases/25.2.0/arm64/deepin-desktop-community-25.2.0-arm64.iso 的 HTTP 头

[W1] https://www.microsoft.com/en-us/windows/windows-11-specifications
[W2] https://www.microsoft.com/en-us/software-download/windows11arm64

[AP1] https://developer.apple.com/documentation/virtualization/running-linux-in-a-virtual-machine
[AP2] https://developer.apple.com/documentation/virtualization/running-macos-in-a-virtual-machine-on-apple-silicon
Apple 文档使用动态页面，另保存 developer.apple.com/tutorials/data/documentation/virtualization/ 下对应 JSON 作为正文证据。

[AND1] https://www.android-x86.org/installhowto.html
[P1] https://9front.org/releases/
[V1] https://github.com/copy/v86
