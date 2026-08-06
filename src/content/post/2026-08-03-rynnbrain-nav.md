---
title: RynnBrain-Nav 解读：基于具身基础模型的视觉语言导航
publishDate: 2026-08-03T08:00:00+08:00
description: 解读阿里达摩院 RynnBrain 具身基础模型系列中的视觉语言导航（VLN）模型 RynnBrain-Nav，梳理 VLN 任务定义、训练数据与微调方案，以及它在 R2R-CE / RxR-CE 基准上相对 StreamVLN 的提升。
category: deep-learning
tags:
  - vln
  - rynnbrain
  - embodied-ai
  - qwen3-vl
  - streamvln
---

前段时间阿里达摩院开源了 [RynnBrain](https://github.com/alibaba-damo-academy/RynnBrain)（[arXiv: 2602.14979](https://arxiv.org/abs/2602.14979)），一个面向具身智能的基础模型系列。里面有个专门做视觉语言导航（VLN）的变体 RynnBrain-Nav，打法很简单：基座架构不动，直接在导航数据上微调，就把之前 StreamVLN 的 SOTA 刷掉了。我最近正好在看 VLN 方向的工作，就把论文里导航相关的部分读了一遍，整理成这篇笔记。

## 一、什么是视觉语言导航（VLN）？

### 1. 任务定义

VLN 的任务设定很直白：给智能体一句人话指令，比如"走出卧室，穿过客厅，在厨房门口停下"，它要自己走到指定位置。形式化一点说，在时刻 $t$，智能体手里有的是历史观测序列

$$
O = \{o_0, o_1, \ldots, o_t\}
$$

和指令 $Q$，要据此输出动作 $a_t$。每个观测 $o_i$ 就是智能体当前视角拍到的一张 RGB 图，第一人称视角，没有全局地图，也没有上帝视角。

RynnBrain-Nav 沿用 [VLN-CE](https://github.com/jacobkrantz/VLN-CE) 的离散动作空间：

$$
\mathcal{A} = \{\uparrow,\ \leftarrow,\ \rightarrow,\ \text{STOP}\}
$$

分别对应：向前移动 30 cm、向左/向右旋转 15°、终止当前回合。

光看文字可能没感觉，直接看一段仿真环境里的演示：智能体拿到指令后，全靠第一人称画面一步步做决策，最后停在该停的位置。

<video src="/images/2026-08-03-rynnbrain-nav/vln-demo.mp4" controls muted loop playsinline preload="metadata"></video>

> 视频来自 [StreamVLN 项目页](https://streamvln.github.io/)的仿真演示。RynnBrain-Nav 的任务设定和它完全一致，拿来看效果正合适。
>
> 有一点要特意说明：视频右边的俯视地图和移动轨迹是官方做演示时叠上去的，给观众看位置用的——模型自己**看不到这张图**，它能用的输入只有左边的第一人称画面加上那句指令。第一次看很容易误会，所以提一句。

### 2. 评测基准与指标

评测一般在 **VLN-CE** 基准上做，它基于 [Habitat 仿真器](https://arxiv.org/abs/1904.01201)，场景用的是真实扫描的 [Matterport3D](https://arxiv.org/abs/1709.06158)（MP3D）房子，常用两个数据集：

- **R2R-CE**：[R2R](https://arxiv.org/abs/1711.07280)（Room-to-Room）的连续环境版本，指令较短；
- **RxR-CE**：[RxR](https://arxiv.org/abs/1909.12844)，规模更大、指令更长、语言变体更多，属于长时程导航。

为了考察泛化，实验都在 **val-unseen**（训练时没见过的房子）划分上跑。指标这块先说下符号：第 $i$ 条回合的实际轨迹记为 $p^{(i)}$，终点为 $p_T^{(i)}$，目标位置为 $g^{(i)}$，成功阈值 $\tau = 3$ 米。

- **SR**（Success Rate）：成功率，回合结束时停在目标附近就算成功：

$$
\text{SR} = \frac{1}{N}\sum_{i=1}^{N} \mathbb{1}\left[d\left(p_T^{(i)},\ g^{(i)}\right) \le \tau\right]
$$

- **OS**（Oracle Success）：放宽一点，只要轨迹中**任意时刻**进过目标范围就算成功：

$$
\text{OS} = \frac{1}{N}\sum_{i=1}^{N} \mathbb{1}\left[\min_t\, d\left(p_t^{(i)},\ g^{(i)}\right) \le \tau\right]
$$

OS 一定不小于 SR。这两个差距大，说明模型经常"明明路过了目的地，却没停下来"。

- **NE**（Navigation Error）：终点离目标的平均距离（米），越低越好：

$$
\text{NE} = \frac{1}{N}\sum_{i=1}^{N} d\left(p_T^{(i)},\ g^{(i)}\right)
$$

- **SPL**（Success weighted by Path Length）：带路径惩罚的成功率：

$$
\text{SPL} = \frac{1}{N}\sum_{i=1}^{N} S_i\,\frac{\ell_i}{\max\left(L_i,\ \ell_i\right)}
$$

$S_i$ 是这条回合成没成功，$\ell_i$ 是起点到目标的最短路径长度，$L_i$ 是实际走的长度。走得越绕，后面那项越小——光到得了还不行，路径还得短。

- **nDTW**（normalized Dynamic Time Warping）：路径保真度。先用动态时间规整算实际轨迹 $\hat{\tau}$ 和参考轨迹 $\tau^{*}$ 的偏差，再指数归一化：

$$
\text{nDTW} = \exp\left(-\frac{\mathrm{DTW}\left(\hat{\tau},\ \tau^{*}\right)}{|\tau^{*}| \cdot d_{th}}\right)
$$

前面几个指标只看"到没到"，nDTW 还管"是不是按指令说的路线到的"，在 RxR 这种长指令任务上更看重它。

## 二、RynnBrain 基座模型

RynnBrain-Nav 不是从头训的，是在 RynnBrain 基座上微调出来的。所以得先看看这个基座做了什么，导航上的提升基本都来自这里。

![RynnBrain 总体能力概览：自我中心认知、时空定位、物理接地推理与物理感知规划（图片来源：RynnBrain 论文 Figure 1）](/images/2026-08-03-rynnbrain-nav/rynnbrain-overview.png)

### 1. 架构

架构上没有做新的设计，走的是 [Qwen3-VL](https://arxiv.org/abs/2511.21631) 那套仅解码器的视觉-语言架构：视觉编码器、视觉-语言投影器、LLM 主干，直接从 Qwen3-VL-2B / 8B / 30B-A3B-Instruct 初始化，另外用了 DeepStack 和 Interleaved MRoPE 来融合多模态信息。一共三个规模：2B、8B（Dense）和 30B-A3B（MoE）。

![RynnBrain 架构：单视角图、多视角图、视频等视觉输入与文本指令分别经 Vision Encoder / Tokenizer 进入统一的 Dense / MoE 解码器，输出区域、轨迹、指向与文本（图片来源：RynnBrain 论文 Figure 2）](/images/2026-08-03-rynnbrain-nav/rynnbrain-architecture.png)

### 2. 两个关键设计

基座真正花心思的是这两个地方。

**统一的时空表征。** 图像和视频被当成同一种视觉模态处理：视频就是均匀采样出来的帧序列 $\{I_t\}$，静态图像相当于 $T=1$ 的特例。每帧编码成视觉 token 后加上时间位置嵌入，这样模型才能从一长串画面里看出时序和运动——说白了，这就是导航需要的"记忆"能力。

**物理接地的输出空间。** 一般 VLM 让模型用文字去描述位置，RynnBrain 的做法是把边界框、点、轨迹路点这些空间实体归一化到 $[0, 1000]$，编码成**离散坐标 token**：

$$
\text{token} = \lfloor \text{coordinate} \times 1000 \rfloor
$$

这样一来，预测坐标就从回归问题变成了分类问题，模型可以像吐文字一样，用同一套自回归机制吐出精确的物理位置。

### 3. 这两个设计跟导航有什么关系

先说清楚一点：RynnBrain-Nav 输出的是动作符号（↑/←/→/STOP），并不直接输出坐标 token——坐标 token 主要是 CoP / Plan / VLA 那几个变体在用。但这不代表基座的两个设计对导航没用：

- **时空表征**正好对上 Nav 的多轮对话形式（下一节细说）：模型每走一步都要回溯之前几十上百帧的观测，这就是基座预训练时练过的长视频理解能力；
- **物理接地**让基座对第一人称画面里的空间指代更敏感——指令里说"沙发旁边""走廊尽头"，模型得真知道这些在哪，才能跟着走。

第四节的数据也能佐证：数据和训练配置原封不动，只把基座从 Qwen3-VL 换成 RynnBrain，成功率就涨了 4 个点左右。

## 三、RynnBrain-Nav 的训练方案

训练方案本身不复杂，整个流程一张图就能讲清楚：

![RynnBrain-Nav 训练流程：三类数据来源汇聚为图文交错的 VLN 数据集，组织成多轮对话后在 RynnBrain 基座上做全参数 SFT](/images/2026-08-03-rynnbrain-nav/nav-training-pipeline.svg)

### 1. 数据形式：多轮对话

数据形式上没有自己造轮子，直接沿用了 [StreamVLN](https://github.com/InternRobotics/StreamVLN) 的设置：把导航轨迹切成一串"观测-动作"对

$$
d_i = (o_i, a_i)
$$

训练目标就是看到当前观测 $o_i$、结合之前的对话历史，预测下一个动作 $a_i$。整个导航过程被写成图文交错的多轮对话 $\{o_0, a_0, o_1, a_1, \ldots, o_n, a_n\}$，历史观测和动作也就顺便充当了模型的"情景记忆"，训练和推理形式完全一致。

从上面的演示视频里抽三帧出来，"观测-动作"交错推进的过程就很直观了：

![从演示视频第一人称画面中抽取的观测-动作序列：模型每看到一帧画面（观测 o）就输出一段动作（a），随后看到下一帧，如此往复直到输出 STOP](/images/2026-08-03-rynnbrain-nav/vln-obs-action-strip.png)

对话模板具体长什么样？我去翻了 StreamVLN 的开源代码（[vln_action_dataset.py](https://github.com/InternRobotics/StreamVLN/blob/main/streamvln/dataset/vln_action_dataset.py)），一个训练样本大致是下面这个样子（指令就用演示视频里那条，动作序列是我随手写的示意）：

```text
human: You are an autonomous navigation assistant.
       Your task is to
       "From the sunken tub, head towards the exit,
        climbing three steps. Continue forward to
        another short staircase of three steps and
        climb them. Stop at the entrance to the
        room on your right."
       Devise an action sequence to follow the
       instruction using the four actions:
       TURN LEFT (←) or TURN RIGHT (→) by 15°,
       MOVE FORWARD (↑) by 30 cm, or STOP.
       you can see <图像帧 o0>.
gpt:   ↑↑↑↑
human: there is <图像帧 o1>.
gpt:   →↑↑↑
human: you can see <图像帧 o2>.
gpt:   ↑↑
...
gpt:   STOP
```

指令只在开头说一次，之后每一轮 human 侧给一帧当前观测，gpt 侧输出接下来几步的动作。模型想走对，就必须靠不断累积的对话历史。

### 2. 数据收集

数据是用 Habitat 仿真器跑出来的，按真值动作（ground truth actions）生成图文交错的样本：

- 主体是 **45 万个视频片段**，来自 R2R、[R2R-EnvDrop](https://arxiv.org/abs/1904.04195) 和 RxR 的轨迹，覆盖 **60 个 MP3D 环境**；
- 再从 [ScaleVLN](https://github.com/wz0919/ScaleVLN) 里取了 **30 万样本**做扩充，补场景多样性；
- 另外用了**多轮 [DAgger](https://arxiv.org/abs/1011.0686)** 收集纠错数据——模型走偏了之后怎么拐回来，这对实际部署的鲁棒性很关键。

### 3. 微调设置

| 项目 | 配置 |
| --- | --- |
| 优化器 | [AdamW](https://arxiv.org/abs/1711.05101) + 余弦学习率调度 |
| 峰值学习率 | LLM / 投影器：$2 \times 10^{-5}$；视觉编码器：$2 \times 10^{-6}$ |
| 预热 | 3% |
| 训练轮数 | 1 epoch |
| 全局批次大小 | 256 |
| 视频采样 | 2 FPS，最多 2048 帧 |
| 最大上下文长度 | 16384 tokens |
| 显存优化 | [DeepSpeed ZeRO-1](https://arxiv.org/abs/1910.02054) |

全参数 SFT，训练框架基于 HuggingFace Transformers，代码已开源。

## 四、实验结果

RynnBrain-Nav 在 R2R-CE 和 RxR-CE 的 val-unseen 上做到了 SOTA。对比对象有：同样基于 VLM 的 [NaVILA](https://arxiv.org/abs/2412.04453) 和 [Uni-NaVid](https://arxiv.org/abs/2412.06224)、用强化学习微调的 [VLN-R1](https://arxiv.org/abs/2506.17221)、之前的 SOTA StreamVLN，以及"直接微调 Qwen3-VL"这个消融对照。官方项目页给的完整结果如下（RynnBrain-Nav 是 8B 版本）：

![RynnBrain-Nav 与其他模型在 R2R / RxR（Val-Unseen）上的完整对比（图片来源：RynnBrain 项目页）](/images/2026-08-03-rynnbrain-nav/nav_results.png)

我把数字抄成表格，方便看。

**R2R-CE（Val-Unseen）**

| 模型 | SR ↑ | SPL ↑ | OS ↑ | NE ↓ |
| --- | --- | --- | --- | --- |
| **RynnBrain-Nav (8B)** | **58.6** | 49.6 | **71.6** | **4.92** |
| Qwen3-VL<sub>finetuned</sub> (8B) | 54.7 | 48.3 | 63.7 | 5.06 |
| StreamVLN (7B) | 56.9 | **51.9** | 64.2 | 4.98 |
| NaVILA (7B) | 54.0 | 49.0 | 62.5 | 5.22 |
| UniNavid (7B) | 47.0 | 42.7 | 53.3 | 5.58 |
| VLN-R1 (7B) | 30.2 | 21.8 | 41.2 | 7.00 |

**RxR-CE（Val-Unseen）**

| 模型 | SR ↑ | SPL ↑ | nDTW ↑ | NE ↓ |
| --- | --- | --- | --- | --- |
| **RynnBrain-Nav (8B)** | **56.1** | 42.7 | 59.6 | **6.20** |
| Qwen3-VL<sub>finetuned</sub> (8B) | 51.8 | 40.5 | 56.7 | 6.58 |
| StreamVLN (7B) | 52.9 | **46.0** | **61.9** | 6.22 |
| NaVILA (7B) | 49.3 | 44.0 | 58.9 | 6.77 |
| UniNavid (7B) | 48.7 | 40.9 | - | 6.24 |
| VLN-R1 (7B) | 22.3 | 17.5 | - | 10.40 |

这张表里有几个点我觉得值得展开说说。

**1. 架构一点没动，换个基座就涨了。** RynnBrain-Nav 和 StreamVLN 用的是一模一样的数据和训练配置，结果 SR 在 R2R 上从 56.9 涨到 58.6（+1.7），在 RxR 上从 52.9 涨到 56.1（+3.2）。这基本可以排除数据和方法的功劳，提升就是基座预训练带来的。

**2. 基座决定了微调的上限。** 同样一批数据，拿 RynnBrain 做基座比直接微调 Qwen3-VL 高了 4 个点左右（R2R 58.6 vs 54.7，RxR 56.1 vs 51.8）。说明基座预训练时灌进去的时空记忆和物理接地能力，确实迁移到了导航上。

**3. 但也不是全面碾压。** 注意看 SPL：RynnBrain-Nav 在两个基准上都比 StreamVLN 低（R2R 49.6 vs 51.9，RxR 42.7 vs 46.0），RxR 的 nDTW 也更低（59.6 vs 61.9）。换句话说，它**更容易走到终点，但走得更绕**。原因论文没细说，我猜和多轮 DAgger 纠错数据有关——模型学会了"走偏了再拐回来"，成功率上去了，轨迹自然就没那么干净。这只是我的猜测，没有证据。

## 五、总结

通读下来，RynnBrain-Nav 本身没提出什么新的导航架构，它更像一个论证：**一个预训练时认真学过时空记忆和物理接地的通用基座，不做任何架构改动，就能把下游导航任务的上限抬高一截。** 这也是整个 RynnBrain 系列的思路——先训一个"懂物理世界"的大脑，再低成本后训练出导航（Nav）、规划（Plan）、动作（VLA）这些专用模型。

权重（2B / 8B）、训练代码和 Cookbook 都开源了。之后有空我打算把代码拉下来跑一跑，真跑通了再写一篇实践记录。

## 参考资料

- [RynnBrain: Open Embodied Foundation Models (arXiv:2602.14979)](https://arxiv.org/abs/2602.14979)
- [GitHub: alibaba-damo-academy/RynnBrain](https://github.com/alibaba-damo-academy/RynnBrain)
- [RynnBrain 项目页](https://alibaba-damo-academy.github.io/RynnBrain.github.io/)
- [StreamVLN: Streaming Vision-and-Language Navigation via SlowFast Context Modeling (arXiv:2507.05240)](https://arxiv.org/abs/2507.05240)
- [StreamVLN 项目页](https://streamvln.github.io/) / [GitHub: InternRobotics/StreamVLN](https://github.com/InternRobotics/StreamVLN)
- [VLN-CE: Vision-and-Language Navigation in Continuous Environments](https://github.com/jacobkrantz/VLN-CE)
- [R2R (arXiv:1711.07280)](https://arxiv.org/abs/1711.07280) / [RxR (arXiv:1909.12844)](https://arxiv.org/abs/1909.12844) / [R2R-EnvDrop (arXiv:1904.04195)](https://arxiv.org/abs/1904.04195) / [ScaleVLN](https://github.com/wz0919/ScaleVLN)
- [Qwen3-VL Technical Report (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [DAgger (arXiv:1011.0686)](https://arxiv.org/abs/1011.0686)
