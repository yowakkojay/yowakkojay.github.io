---
title: 归一化（BN、LN 与 RMSNorm）
publishDate: 2026-02-21T08:00:00+08:00
description: 从 Z-Score 标准化到 Batch Norm、Layer Norm、RMSNorm，深入对比深度学习中的归一化方法，并用 Pytorch 代码演示它们在 4 维张量上的差异。
tags:
  - 深度学习
  - normalization
  - batchnorm
  - layernorm
  - rmsnorm
  - llm
---

简单来说，归一化就是**把数据通过某种算法，缩放到一个特定的范围（通常是 0 到 1，或者均值为 0、方差为 1）**。

## 一、什么是归一化 (Normalization)？

### 1. 为什么要归一化？
想象一下，你正在训练一个预测房价的模型。

- 特征 A 是"房屋面积"，范围是 $40 \sim 500$ 平方米。
- 特征 B 是"房间数量"，范围是 $1 \sim 5$ 个。

如果不做归一化,数字大的特征（面积）会对模型产生巨大的影响，导致模型忽略掉数字小的特征（房间数）。此外，数据分布如果不均匀，梯度下降的过程会非常曲折（如下图所示），导致训练很慢，甚至无法收敛。

#### （1）归一化的作用
1. 加速收敛：让损失函数的等高线变得更圆（更均匀），梯度下降可以直接指向最低点。
2. 数值稳定：避免数据过大导致梯度爆炸，或过小导致梯度消失。
3. 公平性：让不同量纲的特征拥有同等的话语权。

### 2. 最基础的公式 (Z-Score Normalization)
这是深度学习中最常用的标准化方法：

$$
\widehat{x} = \frac{x - \mu}{\sigma}
$$

- $x$：原始数据
- $\mu$：均值 (Mean)
- $\sigma$：标准差 (Standard Deviation)

经过处理后，数据会变成均值为 0，方差为 1 的分布。

```python
import numpy as np
from sklearn.preprocessing import StandardScaler

# -----------------------
# 1. 构造一个示例数据集
# -----------------------
# 特征1：房屋面积 (40~500)
# 特征2：房间数量 (1~5)
data = np.array([
    [50, 2],
    [80, 3],
    [120, 3],
    [200, 4],
    [300, 5],
    [450, 5]
])

print("📌 原始数据：")
print(data)

# -----------------------
# 2. 使用自己写的公式进行标准化
# -----------------------
mean = np.mean(data, axis=0)
std = np.std(data, axis=0)
normalized_manual = (data - mean) / std

print("\n📌 手动计算标准化后的数据 (Z-Score):")
print(normalized_manual)

# -----------------------
# 3. 使用 sklearn 标准化
# -----------------------
scaler = StandardScaler()
normalized_sklearn = scaler.fit_transform(data)

print("\n📌 sklearn 标准化后的数据（应与手写计算几乎一致）：")
print(normalized_sklearn)

# -----------------------
# 4. 比较两者误差（应该非常小）
# -----------------------
print("\n📌 两种方法误差对比：")
print(np.abs(normalized_manual - normalized_sklearn))

```

<details>
<summary>点击查看运行结果</summary>

```text
📌 原始数据：
[[ 50   2]
 [ 80   3]
 [120   3]
 [200   4]
 [300   5]
 [450   5]]

📌 手动计算标准化后的数据 (Z-Score):
[[-1.07972363 -1.50755672]
 [-0.8637789  -0.60302269]
 [-0.5758526  -0.60302269]
 [ 0.          0.30151134]
 [ 0.71981575  1.20604538]
 [ 1.79953938  1.20604538]]

📌 sklearn 标准化后的数据（应与手写计算几乎一致）：
[[-1.07972363 -1.50755672]
 [-0.8637789  -0.60302269]
 [-0.5758526  -0.60302269]
 [ 0.          0.30151134]
 [ 0.71981575  1.20604538]
 [ 1.79953938  1.20604538]]

📌 两种方法误差对比：
[[0. 0.]
 [0. 0.]
 [0. 0.]
 [0. 0.]
 [0. 0.]
 [0. 0.]]

```

</details>

## 二、深度学习中的两大归一化技术



在深度神经网络中，我们不仅要对输入数据做归一化，还需要对**中间层的输出**做归一化。因为随着网络层数的加深，每一层的参数变动会导致下一层输入的分布发生剧烈变化（这被称为 Internal Covariate Shift）。

这就引出了 **Batch Normalization (BN)** 和 **Layer Normalization (LN)**。它们的核心区别在于：**计算均值 $\mu$ 和方差 $\sigma$ 的维度不同。**

为了方便理解，假设我们的输入数据是一个立方体 $[N, C, H, W]$（对于图像）或者二维矩阵 $[N, D]$（对于NLP）。

- $N$：Batch Size（这批数据有多少条，比如 32 张图）。
- $C/D$：Channel/Dimension（特征维度，比如 RGB 通道或词向量长度）。



### 1. 批量归一化 (Batch Normalization - BN)



**核心思想：** "纵向"归一化。

BN 关注的是**整个 Batch** 在**同一个特征通道**上的分布。它会查看这批数据中所有样本在第 1 个特征上的值，算出均值和方差，然后归一化；再看第 2 个特征，以此类推。

- **操作方式：** 固定特征维度，在 Batch 维度 ($N$) 上进行统计。
- **比喻：** 老师批改试卷。BN 就像是老师**算出全班同学（Batch）在"数学"这一科（Feature）的平均分**，然后看小明的数学分相对于全班是高还是低。
- **适用场景：** **计算机视觉 (CV)**。因为图像的不同样本之间，同一通道（比如红色通道）具有相似的物理意义，且 Batch Size 通常较大。
- **缺点：**
  - 极其依赖 Batch Size 的大小。如果 Batch Size 太小（比如只有 1 或 2），统计出的均值和方差就没有代表性，模型效果会很差。
  - 对于变长的序列数据（如文本），很难应用。



### 2. 层归一化 (Layer Normalization - LN)



**核心思想：** "横向"归一化。

LN 关注的是**单个样本**内部**所有特征**的分布。它不关心其他样本怎么样，只关心当前这个样本自己的特征分布情况。

- **操作方式：** 固定样本维度，在特征维度 ($C$ 或 $D$) 上进行统计。
- **比喻：** 综合素质评价。LN 就像是老师**不看别的同学，只看小明自己（Sample）的所有科目（Features）**，算出小明自己的平均分，看他的数学分相对于他自己的平均水平是高还是低。
- **适用场景：** **自然语言处理 (NLP)**，比如 Transformer、BERT、GPT。因为文本数据的长度是不固定的，且不同样本之间的特征（词向量）往往没有图像那样严格对应的物理意义。
- **优点：**
  - 完全不依赖 Batch Size，单条数据也能归一化。
  - 非常适合处理变长序列（RNN/LSTM/Transformer）。

### 3. 差异



| **特性**             | **批量归一化 (Batch Norm)**   | **层归一化 (Layer Norm)**       |
| -------------------- | ----------------------------- | ------------------------------- |
| **计算方向**         | **竖着切** (跨样本，同特征)   | **横着切** (跨特征，同样本)     |
| **统计范围**         | 对**一列**数据求均值/方差     | 对**一行**数据求均值/方差       |
| **依赖 Batch Size?** | **是** (Batch 太小会失效)     | **否** (与 Batch 大小无关)      |
| **主要应用领域**     | **CV (CNN, ResNet)**          | **NLP (Transformer, RNN)**      |
| **推理时的行为**     | 使用训练期累计的全局均值/方差 | 依然实时计算当前输入的均值/方差 |

```python
import torch
import torch.nn as nn

# 假设数据：Batch Size=2, 特征维度=3
x = torch.tensor([
    [1.0, 2.0, 3.0],  # 样本 1
    [4.0, 5.0, 6.0]   # 样本 2
])

# --- 1. Batch Normalization ---
# 它是对每一列（特征）做归一化
# 第一列是 [1.0, 4.0]，均值 2.5，标准差 1.5
bn = nn.BatchNorm1d(num_features=3) 
# 输出结果中，第一列的数据会被拉伸到均值0附近
print(bn(x))

# --- 2. Layer Normalization ---
# 它是对每一行（样本）做归一化
# 第一行是 [1.0, 2.0, 3.0]，均值 2.0，标准差 ≈ 1.2247
ln = nn.LayerNorm(normalized_shape=3)
# 输出结果中，第一行的数据会被拉伸到均值0附近
print(ln(x))
```

<details>
<summary>点击查看运行结果</summary>

```text
tensor([[-1.0000, -1.0000, -1.0000],
        [ 1.0000,  1.0000,  1.0000]], grad_fn=<NativeBatchNormBackward0>)
tensor([[-1.2247,  0.0000,  1.2247],
        [-1.2247,  0.0000,  1.2247]], grad_fn=<NativeLayerNormBackward0>)

```

</details>

### 4. 四维张量中的归一化

如果把维度从2D扩展到4D，计算的方法也类似，这里以图像任务为例。

在图像任务（如 CNN）中，数据通常以 4 维张量的形式存在：


$$
[N, C, H, W]
$$

- **N (Batch Size)**: 批次大小（比如 32 张图）
- **C (Channel)**: 通道数（比如 RGB 图片就是 3，中间层可能是 64, 128...）
- **H (Height)**: 图片高度
- **W (Width)**: 图片宽度

对于这个 $[N, C, H, W]$ 的"四维大方块"，**批量归一化 (BN)** 和 **层归一化 (LN)** 的切分方式会有巨大的不同。

#### （1）批量归一化 (Batch Normalization, BN) —— "通道为王"



在图像中，BN 的核心逻辑是：**不同的通道（Channel）代表不同的特征（比如红色、纹理、边缘），我们要独立对待每一个通道，但在该通道内部，我们要统管全局。**

- 计算逻辑：

  对于第 $k$ 个通道（比如 R 通道），BN 会把这一个 Batch 中所有图片 ($N$) 的 所有像素点 ($H \times W$) 全部拿出来，放在一起算均值和方差。

  也就是说，它聚合了 **N, H, W** 三个维度，只保留 **C** 维度。

- 直观理解：

  想象你有 32 张彩色照片。

  BN 说："我现在要标准化红色通道。我不管你是第几张照片，也不管你是照片左上角还是右下角的像素，只要你是红色的数值，都归我管。"

  它会算出这 32 张图里所有红色像素的平均值，然后把大家的红色值都归一化。接下来再算绿色通道，以此类推。

- 结果形状：

  如果你有 $C$ 个通道，你就会得到 $C$ 个均值 ($\mu$) 和 $C$ 个方差 ($\sigma$)。


```python
import torch
import torch.nn as nn

# 输入：32张图，3个通道，224x224
# shape: [32, 3, 224, 224]
x = torch.randn(32, 3, 224, 224)

# BN 计算时的聚合维度：(0, 2, 3) -> (N, H, W)
mean = x.mean(dim=(0, 2, 3), keepdim=True) 
# 得到的 mean shape: [1, 3, 1, 1] -> 只有 C 维度保留了数据
print(mean.shape)
print(mean)
```

<details>
<summary>点击查看运行结果</summary>

```text
torch.Size([1, 3, 1, 1])
tensor([[[[-0.0007]],

         [[ 0.0003]],

         [[ 0.0013]]]])

```

</details>

#### （2）层归一化 (Layer Normalization, LN) —— "单图自理"



LN 在图像中比较少用（除非是 Vision Transformer），它的核心逻辑是：**每一张图片都是独立的个体，不看别人。**

- 计算逻辑：

  对于第 $i$ 张图片，LN 会把它所有的通道 ($C$) 以及所有的像素点 ($H \times W$) 全部拿出来，混在一起算一个均值和方差。

  也就是说，它聚合了 **C, H, W** 三个维度，只保留 **N** 维度。

- 直观理解：

  LN 说："我是第 1 张照片。我不管隔壁第 2 张照片是什么样，也不管我的红色通道和绿色通道代表什么不同物理意义。我就算我自己这一整张图里所有数值的平均值。"

- 结果形状：

  如果你有 $N$ 张图，你就会得到 $N$ 个均值 ($\mu$) 和 $N$ 个方差 ($\sigma$)。


```python
import torch
import torch.nn as nn

# 输入：32张图，3个通道，224x224
# shape: [32, 3, 224, 224]
x = torch.randn(32, 3, 224, 224)

# LN 计算时的聚合维度：(1, 2, 3) -> (C, H, W)
mean = x.mean(dim=(1, 2, 3), keepdim=True)
# 得到的 mean shape: [32, 1, 1, 1] -> 只有 N 维度保留了数据
print(mean.shape)
print(mean)
```

<details>
<summary>点击查看运行结果</summary>

```text
torch.Size([32, 1, 1, 1])
tensor([[[[-0.0035]]],


        [[[-0.0017]]],


        [[[ 0.0026]]],


        [[[ 0.0017]]],


        [[[ 0.0004]]],


        [[[-0.0018]]],


        [[[-0.0012]]],


        [[[ 0.0003]]],


        [[[ 0.0042]]],


        [[[-0.0022]]],


        [[[-0.0012]]],


        [[[ 0.0043]]],


        [[[ 0.0075]]],


        [[[-0.0053]]],


        [[[ 0.0005]]],


        [[[-0.0011]]],


        [[[ 0.0033]]],


        [[[-0.0022]]],


        [[[ 0.0028]]],


        [[[ 0.0007]]],


        [[[-0.0018]]],


        [[[-0.0025]]],


        [[[ 0.0045]]],


        [[[ 0.0044]]],


        [[[-0.0016]]],


        [[[-0.0011]]],


        [[[-0.0014]]],


        [[[ 0.0011]]],


        [[[-0.0002]]],


        [[[-0.0003]]],


        [[[ 0.0045]]],


        [[[ 0.0001]]]])

```

</details>

### 5. 进阶：其他归一化方法 (IN 和 GN)



在图像领域，当 BN 不好用（比如 Batch Size 很小）时，我们通常不会直接用 LN，而是用 **Instance Norm (IN)** 或 **Group Norm (GN)**。这俩更容易和 LN 搞混。



#### （1）Instance Normalization (IN) —— "单图单通道"



- **逻辑**：既不看别的图片（像 LN），也不混淆不同通道（像 BN）。
- **操作**：它算出的是**某一张图片**中，**某一个通道**的均值。
- **应用**：**风格转移 (Style Transfer)**。因为风格通常只和单张图的特定纹理（通道）有关，不需要跟别的图片对比，也不需要跟别的颜色通道对比。



#### （2）Group Normalization (GN) —— "通道分组"



- **逻辑**：这是 LN 和 IN 的折中方案。它不把所有通道 $C$ 混在一起（LN 太粗暴），也不把通道完全独立（IN 太细碎）。它把通道分成几组（Group），在组内做归一化。
- **应用**：**目标检测**（Batch Size 通常很小，BN 失效时，GN 是最佳替代品）。

## 三、RMSNorm

你会在 **Qwen3**、**Llama 3**、**Gemma** 以及几乎所有现代最强 LLM（大语言模型）的架构图中看到 **RMSNorm**（Root Mean Square Normalization）。

可以这么说：**在 LLM 时代，Layer Norm (LN) 已经是"前朝元老"了，而 RMSNorm 则是现在的"当红明星"。**

RMSNorm 本质上是 Layer Norm 的**简化版**和**加速版**。

### 1. 为什么有了 Layer Norm 还要造一个 RMSNorm？



为了回答这个问题，我们需要回看 Layer Norm (LN) 的公式。



#### （1）传统的 Layer Norm 回顾



LN 的计算分为两步：

1. **去均值 (Center)：** $x - \mu$ （让数据中心对齐到 0）
2. **除方差 (Scale)：** 除以 $\sigma$ （让数据缩放到统一幅度）

公式如下：



$$
\hat{x} = \frac{x - \mu}{\sigma} \cdot \gamma + \beta
$$

这里有两个操作：**平移（减 $\mu$）** 和 **缩放（除 $\sigma$）**。



#### （2）RMSNorm 的发现



RMSNorm 的作者（Geoffrey Hinton 的学生）在研究中发现了一个惊人的现象：

Layer Norm 起作用，主要是靠"缩放（Scaling）"，而"平移（Centering）"其实没啥大用！

也就是说，把数据拉到均值为 0 这个操作，对于深层 Transformer 的训练稳定性贡献很小，但计算均值 $\mu$ 却要花时间。



#### （3）RMSNorm 的核心逻辑



既然"平移"没用，那就砍掉它！

RMSNorm 不去计算均值 $\mu$，也不做 $x - \mu$ 的操作。它强制认为数据的均值就是 0（或者说它不在乎均值是多少），它只做一件事：根据数据的"幅值"进行缩放。



### 2. RMSNorm 的公式与 Layer Norm 对比



为了直观，我们假设输入向量 $x = [x_1, x_2, ..., x_n]$。



#### （1）计算统计量 (The Statistic)



- Layer Norm (算标准差):

  

  $$\sigma = \sqrt{\frac{1}{n} \sum (x_i - \mu)^2}$$

  

  (注意：这里必须先算均值 $\mu$，再算每个数和均值的差，计算量大)

- RMSNorm (算均方根 RMS):

  

  $$RMS(x) = \sqrt{\frac{1}{n} \sum x_i^2}$$

  

  (注意：直接算平方和的平均再开方，不需要算均值 $\mu$，速度快)



#### （2）归一化操作



- Layer Norm:

  

  $$\hat{x} = \frac{x - \mu}{\sigma}$$

- RMSNorm:

  

  $$\hat{x} = \frac{x}{RMS(x)}$$



#### （3）仿射变换 (Affine Transformation)



- **Layer Norm:** 有两个可学习参数：缩放因子 $\gamma$ 和 偏置 $\beta$。
- **RMSNorm:** **只有一个**可学习参数：缩放因子 $\gamma$（通常写作 $g$）。它把 $\beta$ 也砍掉了，因为既然不做平移，就不需要偏置。



### 3. 为什么 LLM (如 Qwen3) 偏爱 RMSNorm？



这就涉及到 LLM 训练的痛点了：**规模太大，速度太重要。**



#### （1）计算速度更快 (Speed)



RMSNorm 少算了一个均值 $\mu$，少做了一次减法。虽然在单层看微不足道，但在一个几十层深、数千亿参数、训练语料以 Token 为万亿单位计算的模型中，这些节省下来的浮点运算（FLOPS）加起来就是**巨大的训练时间和电费节省**。

- 实验表明，RMSNorm 可以比 LN 提速约 **10% ~ 40%**（取决于具体实现）。



#### （2）效果不降反升 (Performance)



令人惊讶的是，去掉了"去均值"操作，模型的收敛效果并没有变差，在很多任务上甚至微弱优于 LN。这证明了 Transformer 确实具有内在的鲁棒性，不需要强行把分布中心拉回 0。



#### （3）数值稳定性 (Stability)



RMSNorm 的公式更简单，分母更不容易出现极端情况，对于使用 fp16（半精度）或 bf16 进行训练的大模型来说，数值上更稳定，不容易炸梯度。



### 4. 代码实现对比



看代码最能体现它的"简洁"：

```python
import torch
import torch.nn as nn

class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        # 只有一个可学习参数：weight (即 gamma)
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x):
        # 1. 计算均方根 (RMS)
        # x.pow(2) -> 平方
        # .mean(-1) -> 求均值
        # + eps -> 防止分母为0
        # .rsqrt() -> 开根号并取倒数 (1/sqrt(...))
        rms = torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)
        
        # 2. 归一化并应用可学习参数
        return x * rms * self.weight

# 对比 Layer Norm
# ln = nn.LayerNorm(dim) 
# ln 内部会有减去均值的操作，并且有 weight 和 bias 两个参数
```

```python
# 构造输入数据
batch_size, seq_len, dim = 2, 5, 4
x = torch.randn(batch_size, seq_len, dim)

# 1. 使用 RMSNorm
rms_norm = RMSNorm(dim)
out_rms = rms_norm(x)

print(f"Input shape: {x.shape}")
print(f"RMSNorm output shape: {out_rms.shape}")
print("\nRMSNorm output (first token of first batch):")
print(out_rms[0, 0])

# 验证 RMS 归一化特性：
# RMSNorm 不保证均值为 0，但保证均方根 (RMS) 接近 1 (在 gamma=1 时)
# 这里手动计算一下输出的 RMS
rms_val = torch.sqrt(torch.mean(out_rms[0, 0]**2))
print(f"\nManual calculation of output RMS (should be approx 1.0): {rms_val.item():.4f}")

# 2. 对比 LayerNorm
layer_norm = nn.LayerNorm(dim, elementwise_affine=False) # 关闭仿射变换以便对比基础统计特性
out_ln = layer_norm(x)

print("\nLayerNorm output (first token of first batch):")
print(out_ln[0, 0])

# 验证 LayerNorm 特性：均值为 0，方差为 1 (进而标准差为1)
print(f"LayerNorm mean (should be approx 0): {out_ln[0, 0].mean().item():.4f}")
print(f"LayerNorm std  (should be approx 1): {out_ln[0, 0].std(unbiased=False).item():.4f}")
```

<details>
<summary>点击查看运行结果</summary>

```text
Input shape: torch.Size([2, 5, 4])
RMSNorm output shape: torch.Size([2, 5, 4])

RMSNorm output (first token of first batch):
tensor([0.3121, 0.8634, 0.5433, 1.6917], grad_fn=<SelectBackward0>)

Manual calculation of output RMS (should be approx 1.0): 1.0000

LayerNorm output (first token of first batch):
tensor([-1.0344,  0.0206, -0.5920,  1.6059])
LayerNorm mean (should be approx 0): -0.0000
LayerNorm std  (should be approx 1): 1.0000

```

</details>
