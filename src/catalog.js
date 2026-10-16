export const categories = {
  tiny: { name: '微型奇迹', english: 'SMALL BUT WONDERFUL' },
  desktop: { name: '另一种桌面', english: 'A DIFFERENT WAY' },
  china: { name: '国产探索', english: 'MADE CLOSER TO HOME' },
};

export const discs = [
  {
    id: 'kolibri', name: 'KolibriOS', number: '001', subtitle: '把一个世界，装进一张软盘', category: 'tiny',
    version: '0.7.7.0 · x86 · EN', accent: '#65734d', paper: '#dce0bc', tilt: '-1.5deg',
    description: '一个以汇编语言编写的微型图形操作系统。小小的身躯里，有窗口、工具，也有游戏。看一看，电脑究竟可以有多轻。',
    size: '1.41 MiB', ram: '64 MiB', minimum: '官网最低 12 MB 内存；这里分配 64 MiB。软盘版内容比 LiveCD 精简。',
    quest: '从桌面打开一个小工具，感受微型系统的交互。', ready: true, image: '/images/kolibri.img', drive: 'fda', memory: 64,
    official: 'https://kolibrios.org/en/', country: '国际社区',
  },
  {
    id: 'tinycore', name: 'Tiny Core', number: '002', subtitle: '轻装上阵，从一点点开始', category: 'tiny',
    version: '16.2 · x86 · EN', accent: '#44747a', paper: '#cddfda', tilt: '.7deg',
    description: '只有 24 MiB 的图形版 Linux。把基础系统放进内存，再按需添加扩展。极简，原来也是一种完整的选择。',
    size: '24 MiB', ram: '256 MiB', minimum: '这里分配 256 MiB。官方 FAQ 的 46 MB 是历史下限，不能当作当前版本的体验保证。',
    quest: '打开终端，输入 uname -a，看看这个小系统的内核。', ready: true, image: '/images/tinycore.iso', drive: 'cdrom', memory: 256,
    official: 'http://tinycorelinux.net/', country: '国际社区',
  },
  {
    id: 'haiku', name: 'Haiku', number: '003', subtitle: '另一条时间线里的个人电脑', category: 'desktop',
    version: 'R1 / BETA 6 · x86', accent: '#a3783e', paper: '#e8d8ac', tilt: '-.6deg',
    description: '延续 BeOS 理念的开源系统。不是换了主题的 Linux：它有自己的桌面、文件管理器，以及把文件属性变成搜索线索的方式。',
    size: '1.38 GiB', ram: '建议 1 GiB', minimum: '官方 32 位最低 256 MB 内存、2 GB 磁盘。本轮已核实镜像，运行尚未接入。',
    quest: '在 Tracker 中探索文件属性与查询，认识不同的文件组织方式。', ready: false,
    official: 'https://www.haiku-os.org/', country: '国际社区',
  },
  {
    id: 'deepin', name: 'deepin 深度', number: '004', subtitle: '一份来自中国的桌面答卷', category: 'china',
    version: '25.2.0 · ARM64', accent: '#526a95', paper: '#d0d9e7', tilt: '1deg',
    description: '源自中国的 Linux 发行版，以 DDE 桌面环境和系统应用形成自己的交互风格。控制中心、文件管理器，都是值得慢慢看的地方。',
    size: '5.13 GiB', ram: '待实测', minimum: '已核实 ARM64 ISO 体积；最低资源、通用虚拟机启动和设备兼容性还需验证。',
    quest: '逛一圈 DDE 控制中心，观察它如何组织日常设置。', ready: false,
    official: 'https://www.deepin.org/zh/', country: '中国 · 国产发行版',
  },
  {
    id: 'openkylin', name: 'openKylin', number: '005', subtitle: '从开放社区，走向中文桌面', category: 'china',
    version: '开放麒麟 · 版本待选', accent: '#a35e46', paper: '#e8ceba', tilt: '-1deg',
    description: '由中国社区推动的开源桌面操作系统。UKUI 桌面是值得体验的特色；它与商业麒麟产品属于不同的发行与服务体系。',
    size: '待核实', ram: '待实测', minimum: '尚未锁定发行版本与镜像；下载体积、ARM 虚拟机兼容性和资源需求待调研。',
    quest: '试试 UKUI 的开始菜单、任务栏与桌面设置。', ready: false,
    official: 'https://www.openkylin.top/', country: '中国 · 国产发行版',
  },
];
