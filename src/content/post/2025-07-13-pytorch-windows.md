---
title: 配置Pytorch环境（Win系统）
publishDate: 2025-07-13T08:00:00+08:00
description: 在 Windows 10/11 系统上从零配置 Pytorch 深度学习环境，涵盖 VSCode、Conda、NVIDIA 驱动、CUDA Toolkit、cuDNN 与 pip 安装 Pytorch 的全流程。
tags:
  - pytorch
  - windows
---
## 1. 确保事项

本文档仅针对**Windows 10/11操作系统**。

### 1.1. VSCode

<p style="color:red">
    首先要确保你已经安装好了VSCode这个代码编辑器，并且简略地知道如何使用它。
</p>
> 若未装`VSCode`可自行搜索如何安装，这里就不赘述。
>
> 在最开始的文字里，我想说句题外话，我认为，我们是一群生活在数字信息化时代的现代人，当你遇到暂时解决不了的问题时，要优先思考该如何靠自己解决，你可以借助众多的数字工具，或Google，或chatGPT。只有当你探索未果后，才应该向他人求助。

本文中使用`cmd`的操作均可以在VSCode终端的`cmd`中使用，在VSCode中默认打开终端的快捷键是`ctrl键`和`~键`的组合键。注意`cmd`并非`PowerShell`。

VSCode也可以用Pycharm代替。

### 1.2. Conda

<p style="color:red">
    其次要确保你已经安装好了Conda这个环境管理工具，并且简略地知道该如何使用它。
</p>

> 若未装`Conda`我建议安装`Miniconda`，其相比`Anaconda`更节省存储空间，并且它完全没有可视化界面的特点能帮助你提升programing的水平。

当你在`cmd`中输入`conda info`时，得到报错输出时，你需要重点检查是否已经将conda添加到**系统环境变量**中。如下图：

![conda path](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/conda-path.png)

当你在`cmd`中输入`conda info`时，得到非报错输出时，就可以了，例如：

![conda info](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/conda-info.png)

个人建议1，如果你的C盘存储空间有限，我建议把默认cache和envs文件夹放到C盘之外的地方。

个人建议2，可以配置tsinghua镜像源，可以尽量避免出现一些下载连接超时的问题。

### 1.3. 硬件计算设备（GPU或CPU）

前面提到的`VSCode`和`Conda`都是软件工具。不过要搞AI，最不可或缺的东西是硬件设备，毕竟“巧妇难为无米之炊”。

<p style="color:red">
    然后要确保你的机器（比如笔记本电脑）上有能够用于deep learning的硬件计算设备，最好是一张NVIDIA的显卡（GPU）。无GPU的情况下就只能使用CPU，但CPU仅适合轻量级任务。
</p>
> 如果你已经决定在AI领域一展拳脚了，难道不应该给自己准备一个有力的设备吗？

若你有NVIDIA的显卡（简称N卡），请继续顺着看下去；若你无N卡，请你**重新考虑**你是否真的需要在你的本地机器上做deep learning（DL），这种情况我更推荐借助云平台来做DL，但如果你真的希望在本地做DL的话，请跳到<a href="#4-虚拟环境配置" style="color: yellow">4. 虚拟环境配置</a>这一章。

## 2. NVIDIA显卡驱动

在你已经确保了前面事项中提到的几点内容的情况下，你还需要确保要有N卡的驱动程序，如果你的笔记本电脑是带N卡的游戏本，那么大概率在笔记本出厂时已经为你安装好[GeForce驱动程序](https://www.nvidia.cn/geforce/drivers/)了。接下来，你可以在`cmd`中输入`nvidia-smi`来查看包括显卡型号、驱动版本、运行进程、显存占用、功耗等在内的信息。如下图：

![nvidia-smi](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/nvidia-smi.png)

图中各字段信息解读：（重点可只看我图中红圈里的关键字段，如果找不到表头和数据的对应关系，可以根据下面表格中数据结合图中数据定位表头字段）

**（1）头部信息**

| 字段                                                         | 数据     | 说明                                         |
| :----------------------------------------------------------- | :------- | :------------------------------------------- |
| **NVIDIA-SMI Version**                                       | `576.52` | NVIDIA 系统管理工具版本                      |
| **Driver Version**                                           | `576.52` | 显卡驱动版本（需与CUDA版本匹配）             |
| <span style="color:red; font-weight:bold">CUDA Version</span> | `12.9`   | **驱动支持的最高CUDA版本**（非实际安装版本） |

**（2）GPU状态表格**

| 字段                                                         | 数据                      | 说明                                  |
| :----------------------------------------------------------- | :------------------------ | :------------------------------------ |
| <span style="color:red; font-weight:bold">GPU</span>         | `0`                       | 第一块显卡（编号0）                   |
| **Name**                                                     | `NVIDIA GeForce RTX 5080` | 显卡型号                              |
| **Driver-Model**                                             | `WDDM`                    | Windows显示驱动模式（非计算优化模式） |
| **Bus-Id**                                                   | `00000000:01:00.0`        | GPU硬件总线地址（用于多卡定位）       |
| **Disp.A**                                                   | `On`                      | 显卡当前连接显示器                    |
| **Fan**                                                      | `0%`                      | 风扇停转（低负载时常见）              |
| **Temp**                                                     | `41°C`                    | 核心温度                              |
| **Perf**                                                     | `P5`                      | 性能状态（P0=最高性能，P12=最低）     |
| **Pwr:Usage/Cap**                                            | `19W / 360W`              | 当前功耗19W，最大功耗360W             |
| <span style="color:red; font-weight:bold">Memory-Usage</span> | `4107MiB / 16303MiB`      | 显存占用4.1GB，总量16GB               |
| <span style="color:red; font-weight:bold">GPU-Util</span>    | `1%`                      | GPU计算核心利用率（低负载）           |
| **Compute M.**                                               | `Default`                 | 计算模式（`Default`为默认）           |
| **MIG M.**                                                   | `N/A`                     | 多实例GPU未启用                       |

**（3）进程列表**

| 字段                 | 数据                            | 说明                                 |
| :------------------- | :------------------------------ | :----------------------------------- |
| **GPU**              | `0`                             | 占用GPU编号                          |
| **PID**              | 假设有`3216`                    | 进程ID                               |
| **Type**             | 假设有`C+G`                     | 进程类型（`C`=计算，`G`=图形）       |
| **Process name**     | 假设有`ShellExperienceHost.exe` | 进程名称                             |
| **GPU Memory Usage** | `N/A`                           | 显存占用未显示（通常因图形渲染占用） |

若你没有N卡驱动程序，请自行根据自己机器的情况安装驱动程序。

## 3. CUDA Toolkit及cuDNN

### 3.1. CUDA Toolkit

> 笔者在这里踩过坑，第一次是使用了CUDA 12.1和相应的cuDNN及pytorch，但在最后发现RTX 50系的显卡在这上面并不支持，所以换成了CUDA 12.9。

可以下载的CUDA Toolkit版本应该小于等于前文中显卡信息字段中的<span style="color:red; font-weight:bold">CUDA Version</span>，官网链接：[CUDA Toolkit 12.9 Update 1 Downloads](https://developer.nvidia.com/cuda-downloads?target_os=Windows&target_arch=x86_64&target_version=11&target_type=exe_local)（这里给的链接是CUDA 12.9，需要根据自己机器的情况来选择版本）

![CUDA](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/CUDA-1.png)

下载好后双击安装，这里的路径随意，只是一个临时的文件夹，待安装完成CUDA Toolkit后，该路径下的文件夹会自行删掉的。顺带提一下，安装的CUDA并不是这个路径，安装CUDA的路径是系统默认的装在C盘中的，应该是改不了的。

![CUDA 2](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/CUDA-2.png)

安装CUDA的过程很简单，一直点同意并继续或下一步就可以了。唯一一个要选择的地方选精简安装即可。（下图为笔者安装CUDA 12.1时的截图，CUDA 12.9与之类似）

![CUDA-4](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/CUDA-4.png)

在安装好CUDA后，可以在`cmd`中输入`nvcc -V`进行验证，如下图：

![CUDA 5](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/CUDA-5.png)

### 3.2. cuDNN

在安装好CUDA后，还需要安装cuDNN，注意cuDNN版本必须和CUDA匹配。官网链接：[cuDNN 9.10.2 Downloads](https://developer.nvidia.com/cudnn-downloads?target_os=Windows&target_arch=x86_64&target_version=Agnostic&cuda_version=12)

![cuDNN 1](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/cuDNN-1.png)

下载好之后会得到一个`.zip`格式的压缩包，解压后会有三个文件夹（分别是`bin`、`include`、`lib`这三个文件夹）和一个LICENSE文件，然后需要把这三个文件夹复制粘贴到如下路径：`C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.9`（如果你下载的CUDA不是12.9版本，请根据自己的版本号调整路径，这应该很简单吧？）

粘贴过去后，这一部分就大功告成了。

## 4. 虚拟环境配置

我们可以使用conda或pip来安装pytorch。

> 但是需要注意的是，`pytorch 2.5`版本是pytorch官方最后一个发布在conda上的版本，从2.6版本开始官方将不再通过conda提供预编译包。官方统计数据中使用`pip`安装方式（`Wheel`）的用户居多，且远高于conda（以2.0版本为例，两者占比约为96.3:3.7）。

### 4.1. 创建并激活conda环境

我这里的conda环境命名为`lucidcrucible`，且安装python3.9（截至笔者写此文时，由于pytorch 2.7.1版本的要求，python版本不可以低于3.9）。环境名仅作为参考。

```cmd
conda create -n lucidcrucible python=3.9
conda activate lucidcrucible
```

### 4.2. 通过pip安装pytorch

然后通过pytorch官网给出的下载命令下载，链接：[Start Locally](https://pytorch.org/get-started/locally/)

基于前文中的配置以及GPU可用的情况，我们则可以直接使用下面的命令，但是在开始前请十分注意，当你在运行该命令时，**务必确保你当前处于你希望安装pytorch的虚拟环境中**，如下图中红圈所示，否则你会在你系统默认的python环境中安装pytorch，这可能会导致一系列麻烦的问题，这也是我们使用conda管理python的原因之一。

![pytorch](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/pytorch-1.png)

在你确定好当前环境正确后，就可以通过命令下载安装了：（截至本文写时，由于pytorch支持的最新计算平台还只是CUDA12.8，所以这里下载的是cu128，只要你本地安装的CUDA版本高于pytorch要求的CUDA版本即可，本文中安装的CUDA12.9很明显高于CUDA12.8。多嘴一句，这里的12.9并非`nvidia-smi`显卡信息字段中的<a href="#2-NVIDIA显卡驱动" style="color:red; font-weight:bold">CUDA Version</a>，而是<a href="#31-CUDA Toolkit" style="color: red">CUDA Toolkit</a>处的12.9）

```cmd
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
```

> <span style="color:yellow">    请注意，如果你没有可用的GPU，那么你需要使用下面的命令，下载CPU版本的pytorch，而非GPU版本的pytorch：</span>
>
> ```cmd
> pip3 install torch torchvision torchaudio
> ```

下载过程需要一定时间，请耐心一些。

![pytorch 2](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/pytorch-2.png)

当下载完成后，说明我们马上就要大功告成了！

![pytorch 3](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/pytorch-3.png)

最后，需要在你的虚拟环境中检查一下torch的安装情况、torch的版本以、CUDA（GPU加速）是否可用以及当前pytorch正在使用的GPU设备号。

在你的虚拟环境中输入：

```cmd
python
import torch
torch.__version__
torch.cuda.is_available()
torch.cuda.current_device()
```

![pytorch 4](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/pytorch-4.png)

检查完成后，可以输入`exit()`退出python。

至此，大功告成！🤗🤗🤗

## 5. 总结

在Windows 10/11系统上配置pytorch环境，需要注意的关键点在几个点：

- 硬件计算设备，如GPU或CPU。
- CUDA及cuDNN。
- conda虚拟环境。（conda并非唯一选项）
- pip安装pytorch。（pytorch自2.6版本及2.6版本之后不再支持conda安装）
