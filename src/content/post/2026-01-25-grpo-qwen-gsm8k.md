---
title: 用qwen2.5和gsm8k动手实践GRPO
publishDate: 2026-01-25T08:00:00+08:00
description: 用 Qwen2.5-0.5B/3B/7B 在 GSM8K 上做 GRPO 强化学习的完整实践记录，深入排查奖励陷阱（Reward Trap）、loss 归零、复读机等问题及 reward engineering。
tags:
  - 深度学习
  - grpo
  - qwen
  - gsm8k
  - deepspeed
  - pytorch
---

## 背景

后训练之——强化学习，用qwen2.5-0.5b、qwen2.5-3b、qwen2.5-7b，在gsm8k上进行GRPO。

## 环境

运行环境：Python 3.10.9, Pytorch 2.9.1, CUDA 12.8, trl 0.28.0, transformers 4.57.6, huggingface-hub 0.36.2, datasets 4.5.0, 8 * A800(80GB)

## 实践记录与问题梳理

### 1) 0.5B：初始奖励设计与效果

我发现qwen2.5-0.5b的模型在gsm8k上的表现比较一般，最开始尝试使用的奖励函数：

```python
def reward_func(completions, ground_truth, **kwargs):
    # Regular expression to capture content inside \boxed{}
    matches = [re.search(r"\\boxed\{(.*?)\}", completion[0]['content']) for completion in completions]
    contents = [match.group(1) if match else "" for match in matches]
    # Reward 1 if the content is the same as the ground truth, 0 otherwise
    return [1.0 if c == gt else 0.0 for c, gt in zip(contents, ground_truth)]
```

效果如：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-gsm8k/runs/mx4rygxh) 

![reward](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/0.5b-reward-2.svg)

![loss](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/0.5b-loss-2.svg)

这个是在单卡A800跑的，直接用的python提交到slurm上运行的。

### 2) 0.5B：4 卡并行与分层奖励

后来改了一下用了4卡A800数据并行训练，大致就是配置了一下deepspeed，然后在trl的GRPOConfig配置中设置`deepspeed="ds_config.json"`这个参数为相应的配置文件就行了，最后在提交slurm任务的时候用torchrun来运行。

这里有个点有点坑，就是这里用了分布式训练的话不能在加载模型的时候用`model.to("cuda")`，一定得用分布式环境来分配。还有就是不要使用`device_map="auto"`，这会和 GRPO 的 DDP 逻辑冲突。

没有用vllm，原因是跟deepspeed有冲突。

`ds_config.json`为：

```json
{
    "bf16": { "enabled": true },
    "zero_optimization": {
        "stage": 2,
        "allgather_partitions": true,
        "allgather_bucket_size": 2e8,
        "overlap_comm": true,
        "reduce_scatter": true,
        "reduce_bucket_size": 2e8,
        "contiguous_gradients": true
    },
    "gradient_accumulation_steps": "auto",
    "gradient_clipping": "auto",
    "train_batch_size": "auto",
    "train_micro_batch_size_per_gpu": "auto"
}
```

slurm提交的脚本为：

```bash
#!/bin/bash
#SBATCH --job-name=GRPO_4GPU_Test
#SBATCH --output=./logs/%j_4gpu.out
#SBATCH --error=./logs/%j_4gpu.err
#SBATCH --partition=gpu
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --gres=gpu:4
#SBATCH --cpus-per-task=32
#SBATCH --mem=200GB
#SBATCH --time=00:00:00

source /data1/home/ywj/miniconda3/bin/activate llm-rl

export WANDB_PROJECT="qwen2.5-grpo-4gpu"
MASTER_ADDR=$(scontrol show hostnames $SLURM_JOB_NODELIST | head -n 1)
export MASTER_PORT=12346

torchrun \
    --nproc_per_node=4 \
    --master_addr=$MASTER_ADDR \
    --master_port=$MASTER_PORT \
    deepspeed-GRPO_Qwen2.5-gsm8k.py
```

还有一个重要的点是，还修改了一下奖励函数，如下：

```python
def reward_func(completions, ground_truth, **kwargs):
    # completions 是一个列表的列表，GRPO 的输入格式较特殊
    # completions[i][0]['content'] 获取第i个生成的文本
    responses = [c[0]['content'] for c in completions]
    
    rewards = []
    for res, gt in zip(responses, ground_truth):
        # 1. 提取 \boxed{} 里的内容
        match = re.search(r"\\boxed\{(.*?)\}", res)
        if match:
            ans = match.group(1).strip()
            # 2. 简单的字符串匹配，或者可以更进一步只提炼数字
            if ans == gt:
                rewards.append(1.0)
            else:
                rewards.append(0.1) # 答错了但格式对了，给个辛苦分
        else:
            rewards.append(0.0) # 连格式都没写对，0分
    return rewards
```

用了一种分层的得分，看起来好像效果应该会不错，但是实际上效果不太好，效果如：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-4gpu/runs/a47u0ih9) 

![reward](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/0.5b-reward-1.svg)

![loss](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/0.5b-loss-1.svg)

reward会收敛到0.1，Loss变为0，陷入到了一种叫做奖励陷阱（Reward Trap）的问题中。在GRPO中由于是依赖组内的相对优势，公式可以看作是$A = \frac{R - mean(R)}{std(R)}$。由于0.5b的模型学习能力有限，gsm8k对他来说应该是太难了，但是学习输出boxed的格式对他来说比较容易，所以组内可以就都摆烂了，感觉像是大家都学不会而且既然都有0.1了就别卷了，大家都来躺平。

### 3) 0.5B：继续降低格式奖励

考虑到0.5b模型跑起来比较容易，又想测试一下仅通过减小rewar函数中对于格式奖励部分的值能不能解决上面reward trap的问题，所以就简单改了一下奖励函数（感觉应该不会成功，就简单跑了一点点），如下：

```python
def reward_func(completions, ground_truth, **kwargs):
    responses = [c[0]['content'] for c in completions]
    rewards = []
    
    for res, gt in zip(responses, ground_truth):
        # 1. 提取 \boxed{} 里的内容
        match = re.search(r"\\boxed\{(.*?)\}", res)
        
        if match:
            ans = match.group(1).strip()
            # 改进：简单的字符串清理，增加匹配成功率
            ans_clean = ans.replace(',', '').replace('$', '').strip()
            gt_clean = gt.replace(',', '').replace('$', '').strip()
            
            if ans_clean == gt_clean:
                rewards.append(1.0)  # 满分
            else:
                rewards.append(0.01)  # 答错了但格式对了，给个辛苦分
        else:
            # 连格式都写不对
            rewards.append(0.0)
            
    return rewards
```

效果如：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-4gpu/runs/lb05cxuf) 

![reward](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/0.5b-reward-3.svg)

![loss](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/0.5b-loss-3.svg)

果然跟我想的差不多，果然不出所料的也陷入到了reward trap里，这次是收敛到0.01了，或许是模型太小了所以表达能力有限？

### 4) 3B：规模提升后是否仍有奖励陷阱

为了验证上面提到的猜测，这次换成3b的模型来试试。（如果还是有问题的话，要么就是换更大的模型，要么就是确实是奖励函数不能这么设计。）

效果如：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-4gpu/runs/2lfubxpb) 

![reward](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/3b-reward-1.svg)

![loss](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/3b-loss-1.svg)

果然确实是模型规模的问题，换到3b模型就没有出现reward trap的情况了，看来还是大点的模型更好用。早知如此应该先从当前设备显存能支持的模型中较小但不能最小的模型开始实验验证了（下次记住了）。

在测试集上验证acc的结果为：GRPO之后的3b模型acc是86.05%，GRPO之前的3b模型acc是83.40%。看来GRPO确实是有效果的。

### 5) 7B：训练配置调整

现在再来试试7b的效果，不出意外应该会更好一些。

不过超参数要改一下，还有deepspeed的配置也要改一下。（之前没跑7b是因为直接用pytorch原生的ddp发现爆显存）

主要改动如下：

这次用2张卡，全局batchsize就是2\*16\*4=128。训练和生成的最大长度从1024降低到512。

```python
# 超参数
config = GRPOConfig(
    per_device_train_batch_size=16,
    gradient_accumulation_steps=4,
    num_generations=16,
    learning_rate=5e-6,
    max_completion_length=512,
    ...
```

关于deepspeed就不能用之前的ZeRO stage2了，7b的模型太大了，还是得用ZeRO stage3，不过通信开销会高一点，不过也还好。这个配置可能大概要20个小时。

```json
<!-- ds_config -->
{
    "bf16": { "enabled": true },
    "zero_optimization": {
        "stage": 3,
        "allgather_partitions": true,
        "allgather_bucket_size": 2e8,
        "overlap_comm": true,
        "reduce_scatter": true,
        "reduce_bucket_size": 2e8,
        "contiguous_gradients": true,
        "stage3_prefetch_bucket_size": 5e7,
        "stage3_param_persistence_threshold": 1e6
    },
    "gradient_accumulation_steps": "auto",
    "gradient_clipping": "auto",
    "train_batch_size": "auto",
    "train_micro_batch_size_per_gpu": "auto"
}
```

效果如下：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-2gpu-7b/runs/kmgxeqc5)

![reward](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-reward-1.svg)

![loss](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-loss-1.svg)

### 6) 7B：loss 归零的异常现象

新的问题出现了，reward看起来好像没什么问题，但是loss竟然完全变成0了，也就意味着模型的参数完全不更新了。reward不论怎么变，梯度都是0。问题会出在哪呢？问了一下AI，可能的原因有以下几个：

- KL 散度触发了硬截断（Clipping）： GRPO 也有类似 PPO 的 Clipping 机制。如果你的学习率太高，或者 KL 惩罚太小，模型跑得太快，导致当前策略和旧策略的差异超过了阈值（通常是 0.2），Loss 就会被 Clip 掉。如果步子迈得太大，可能会导致所有样本都落入 Clip 区，梯度直接归零。

- Logits 溢出 (NaN 或 Inf)： 注意 Loss 归零前那几个剧烈的尖刺。那可能是数值不稳定的前兆。如果 Logits 变得非常大，计算 Softmax 或 Log 概率时可能会出现数值溢出。

- Reward 失去了区分度（Advantage = 0）：GRPO 靠组内比较。如果你的 Group 里的所有回复得到的 Reward 完全一模一样（比如全是 1.0），那么组内优势（Advantage）就全是 0，Loss 自然也是 0。但看你的 Reward 图，这种情况概率较小。

在分析了一下训练时wandb缓存的日志，发现了不少问题。

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-clipped-ratio.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-completions-mean_length.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-mean_terminated_length.svg)

先来回看一下GRPO的公式吧：

$$
\mathcal{L}_{\mathrm{GRPO}}(\theta)=-\mathbb{E}_{q\sim\mathcal{Q}}\left[\frac{1}{\lvert G \rvert}\sum_{i\in G}\min\left(r_i(\theta)\hat{A}_i,\operatorname{clip}\left(r_i(\theta),1-\epsilon,1+\epsilon\right)\hat{A}_i\right)\right]
$$

其中策略比率为：

$$
r_i(\theta)=\exp\left(\log\pi_\theta(y_i\mid x)-\log\pi_{\theta_{\mathrm{old}}}(y_i\mid x)\right)
$$

组内优势（Group-wise Advantage）定义为：

$$
\hat{A}_i=\frac{R_i-\mu_G}{\sigma_G+\delta}
$$

其中，

- $\theta$：当前正在优化的策略参数；
- $\theta_{old}$：采样这些completion时所使用的旧策略（冻结）；
- $x$：输入prompt；
- $y_i$：同一个prompt下第i个completion（response）；
- $G$：Group（组），$G = \{y_1, y_2, ..., y_k\}$；
- $R_i$：Reward；
- $\mu_G, \sigma_G$： 组内统计量，均值和标准差；
- $\hat{A}_i$：组内优势；
- $\delta$：数值稳定项；
- $r_i(\theta)$：策略概率比（Policy Ratio），用于衡量当前策略对这个completion的偏离程度；
- $\mathrm{clip}\left(r_i,1-\epsilon,1+\epsilon\right)$：Clipping，防止策略更新过大。

非常多step的completions/clipped_ratio=1.0、completions/mean_length=512、mean_terminated_length=0.0，也就是说大部分的response都被截断到了max_completion_length，这种情况下GRPO会把优势权重压到0（或者当作无效样本按0来计算），然后这种情况又是大量出现，导致了截断样本占满了一整个group，于是loss就变成0了。而reward还在波动是因为它还是在由我写的reward_func来计算的，而又因为采样的原因导致了均值发生变化，所以reward看起来是波动的。（有可能）
    
但是也可能是别的原因，在wandb的日志中还能看到frac_reward_zero_std经常是1.0，且reward_std=0，组内的reward方差为0，优势值那一项自然也就无了，loss也就归0了。（也有可能）

总而言之，loss变成0应该就是优势权重那个地方有问题，但是是由上面两个分析的哪个原因导致的暂时还不清楚。

### 7) 7B：Checkpoint 测试与复现

下面来验证一下吧，拿了step1600的checkpoint来测试一下，max_completion_length为512，拿了10个样本测试，每个样本的num_generations为4，结果如下：

```log
sample=0 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00
sample=1 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00
sample=2 reward_mean=0.0100 reward_std=0.0000 trunc_ratio=1.00
sample=3 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00
sample=4 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00
sample=5 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00
sample=6 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00
sample=7 reward_mean=0.5050 reward_std=0.4950 trunc_ratio=1.00
sample=8 reward_mean=0.5050 reward_std=0.4950 trunc_ratio=1.00
sample=9 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00

=== Overall ===
reward_mean=0.8020
reward_std=0.3960
trunc_ratio=1.00
```

看起来这两种问题都存在，不仅仅是所有生成都截断了，而且reward_std大部分都是0，组内优势约等于0，这两者叠加就把loss变成0了，梯度也就无了。

难不成是因为max_completion_length=512太短了？换成1024试试好了。结果如下：

```log
sample=0 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=1 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=2 reward_mean=0.0100 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=3 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=4 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=5 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=6 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=7 reward_mean=0.2575 reward_std=0.4287 trunc_ratio=1.00 eos_ratio=0.00
sample=8 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00
sample=9 reward_mean=1.0000 reward_std=0.0000 trunc_ratio=1.00 eos_ratio=0.00

=== Overall ===
reward_mean=0.8267
reward_std=0.3762
trunc_ratio=1.00
eos_ratio=0.00
```

竟然还是全都截断了，打印几条样本的response看看好了。但是我还是有个疑问，这虽然截断了，但是reward_mean是1啊，难不成模型输出完结果之后还在一直输出什么奇奇怪怪的内容吗？如果是因为这个的话，那好像能解释的通为何loss变成0了。。。（虽然有的reward_std不是0，但是由于样本组内所有response都被截断，导致了组内所有的response都被看做无效结果，然后又由于所有的样本的所有response都是这样的，就导致了loss为0）

果然是这样，在测试结果中找了一条比较明显的，其输出如下：

```log
sample=1 gen=1 truncated=True has_eos=False
Given that the robe takes 2 bolts of blue fiber, for the white fiber, it takes half of the blue fiber, so for the blue fiber, it takes 2 bolts, therefore, for the white fiber, it takes \( \frac{2}{2}} = 1)\ bolt).

For the blue fiber, it takes 2 bolts, and for the white fiber, it takes 1 bolt). 

Thus, the total bolts is):

\[2 (blue) + 1 (white)}) = 2+1} = 3)\).

So, the final numeric answer for how many bolts in total is \(\boxed{3}})\).

Thus, the final numeric answer for how many bolts in total is \(\boxed{3}}\).

So, after carefully considering the given problem, the final numeric answer for how many bolts in total is \(\boxed{3}}\).

So, after carefully considering the given problem, the final numeric answer for how many bolts in total is \(\boxed{3}}\).

So, after carefully considering the given problem, the final numeric answer for how many bolts in total is \(\boxed{3}}\).

So, after carefully considering the given problem, the final numeric answer for how many bolts in total is \(\boxed{3}}\).

So, ...
```

果真是变成复读机了。看来模型是没学会输出stop token，就是没输出`<|im_end|>`，而且reward函数也没有对此做惩罚，所以就一直在复读。好奇怪，明明用的是7b-instruct，已经是经过sft的模型了，竟然还会这样，那应该是在GRPO的时候给教坏了，看来这reward函数的设计还是挺重要的，还必须要把学会正确结束作为奖励内容加入进去。（那为啥3b的模型没遇到这种问题呢？怪哉）

### 8) 7B：对比测试与现象总结

虽然变成复读机了，但是也可以看一下训练的acc如何，对比结果如下：

```txt
正在验证模型: Initial_Model-7B (Batch Size: 32)...
模型 Initial_Model-7B 的准确率: 89.23%

正在验证模型: GRPO_Trained_Model (Batch Size: 32)...
模型 GRPO_Trained_Model 的准确率: 88.70%
```

虽然变差了，但是也在意料之中吧。

### 9) 7B：引入“正确结束”奖励

然后是修改一下reward函数，再训一下看看。这次就改一下reward函数，其他超参数都保持跟上次一致。

新的reward函数如下：

```python
def reward_func(completions, ground_truth, **kwargs):
    responses = [c[0]['content'] for c in completions]
    rewards = []
    
    for res, gt in zip(responses, ground_truth):
        # 1. 提取 \boxed{} 里的内容
        match = re.search(r"\\boxed\{(.*?)\}", res)
        # 2. 代理的“正确结束”：boxed 后允许少量标点/空白
        ended = bool(re.search(r"\\boxed\{.*?\}\s*[\.!?)]?\s*$", res))
        
        if match:
            ans = match.group(1).strip()
            # 改进：简单的字符串清理，增加匹配成功率
            ans_clean = ans.replace(',', '').replace('$', '').strip()
            gt_clean = gt.replace(',', '').replace('$', '').strip()
            
            if ans_clean == gt_clean:
                rewards.append(1.0 if ended else 0.2)  # 正确且结束才给满分
            else:
                rewards.append(0.01)  # 答错了但格式对了，给个辛苦分
        else:
            # 连格式都写不对
            rewards.append(0.0)
            
    return rewards
```

### 10) 7B：改动后的效果

来看看改动了reward函数之后的效果吧：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-2gpu-7b/runs/my853ipb)

![reward](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-reward-2.svg)

![loss](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-loss-2.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-clipped_ratio.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-mean_length.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-mean_terminated_length-2.svg)

```log
正在验证模型: Initial_Model-7B (Batch Size: 32)...
模型 Initial_Model-7B 的准确率: 89.23%

正在验证模型: GRPO_Trained_Model (Batch Size: 32)...
模型 GRPO_Trained_Model 的准确率: 85.22%
```

通过修改奖励函数中对正常输出stop token的方式，确实解决了clip异常的问题，从而解决loss恒为0的问题。但是这个训练之后的效果怎么还变差了这么多，甚至还不如之前clip异常截断的时候（88.70%）。

看来这种策略也是有问题的，这种策略会压缩reasoning，让模型尽快产生一个看起来像答案的boxed，减少中间token，但是7b模型的能力大部分依赖这种展开方式的推理。一旦在组中出现了极个别答对且有EOS的情况，其他response能推理正确但是没结束，这个有EOS的因素就变成了最大方差的来源，策略更新的方向就变成了更快结束，这样就破坏了原本SFT已有的能力了。

至于之前clip异常的时候acc更高，我觉得应该是因为大量样本被当作无效样本之后梯度不更新直接摆烂了，导致展示出来的效果其实就是没有偏离原始SFT多远的结果，而原始的SFT的模型就已经有89.23%了，所以自然就差不到哪里去了。

我还觉得一个很重要的间接因素是我设置的max_completion_length太短了，qwen2.5-7b的模型要发挥出他推理的能力应该至少还是要768或者1024的。emm尝试一下吧。

这次就把max_completion_length改成1024，然后用4张卡跑一下。结果如下：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-4gpu-7b-l1024/runs/bgagwijt)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-reward-3.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-loss-3.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-clipped-ratio-3.svg)

```log
==============================
模型 GRPO_Trained_Model | 准确率: 85.22%
==============================
```

竟然结果跟之前是一样的。。略微有点失望啊。看来仅仅增加max_completion_length并不能解决问题，还是需要对reward函数进行修改。看来这个reward engineering对GRPO来说还是非常非常重要的。

之前那种显式的把stop放到reward中的方式是不对的，应该在generation的时候明确结构性stop约束。

如此一来的话，那首先对reward进行重构吧，这次还是通过rule-based的方法，用三种不同角度的reward。

```python
# --- 1. 改进的 System Prompt ---
# 强制模型使用 <think> 标签，这有助于展开推理过程
SYSTEM_PROMPT = (
    "User will provide a math problem. You must first use a <think> section to solve the problem step-by-step. "
    "After the reasoning, provide the final numeric answer inside \\boxed{}."
)

# --- 2. 拆分奖励函数 (Reward Functions) ---
# --- 修正后的奖励函数 ---

def correctness_reward_func(completions, ground_truth, **kwargs):
    """
    只负责检查答案是否正确。
    TRL 会自动匹配数据集中的 'ground_truth' 列并传入。
    """
    # 提取内容：completions 通常是 [{'role': 'assistant', 'content': '...'}] 的列表
    responses = [c[0]['content'] for c in completions]
    rewards = []
    
    for res, gt in zip(responses, ground_truth):
        # 提取 \boxed{} 里的内容
        match = re.search(r"\\boxed\{(.*?)\}", res)
        if match:
            ans = match.group(1).strip().replace(',', '').replace('$', '')
            gt_clean = str(gt).strip().replace(',', '').replace('$', '')
            if ans == gt_clean:
                rewards.append(2.0)
            else:
                rewards.append(0.0)
        else:
            rewards.append(0.0)
    return rewards

def format_reward_func(completions, **kwargs):
    """检查格式：是否包含 <think> 和 \boxed{}"""
    responses = [c[0]['content'] for c in completions]
    rewards = []
    for res in responses:
        score = 0.0
        if "<think>" in res and "</think>" in res:
            score += 0.2
        if "\\boxed{" in res:
            score += 0.2
        # 如果模型遵循了先推理再回答的顺序，给额外奖励
        if re.search(r"<think>.*?</think>.*\\boxed{", res, re.DOTALL):
            score += 0.1
        rewards.append(score)
    return rewards

def repetition_penalty_reward_func(completions, **kwargs):
    """反重复奖励"""
    responses = [c[0]['content'] for c in completions]
    rewards = []
    for res in responses:
        # 使用 4-gram 或 5-gram 检查，专门针对“逻辑绕圈子”
        words = res.split()
        if len(words) < 50: 
            rewards.append(0.0)
            continue
            
        # 统计高阶 N-gram 重复
        n = 5 
        grams = [tuple(words[i:i+n]) for i in range(len(words)-n+1)]
        repeat_rate = (len(grams) - len(set(grams))) / len(grams)
        
        # 阶梯式惩罚
        if repeat_rate > 0.2:
            rewards.append(-1.0) # 严重重复，判死刑
        elif repeat_rate > 0.05:
            rewards.append(-0.2) # 轻微重复，小惩大诫
        else:
            rewards.append(0.0)
    return rewards
```

同时还修改了GRPOConfig，如下：

```python
config = GRPOConfig(
    output_dir=f"./outputs/{model.name_or_path.split('/')[-1]}-4gpu-l1024-{time.strftime('%Y%m%d-%H%M%S')}",
    run_name="grpo-qwen-optimized",
    
    learning_rate=5e-6,
    lr_scheduler_type="cosine",
    weight_decay=0.1,
    
    num_train_epochs=2,
    per_device_train_batch_size=16,
    gradient_accumulation_steps=4,
    
    num_generations=8,           # 4卡 A800，每卡生成8个，一共32个样本进行对比，效果较好
    max_completion_length=1024,   # 允许足够的推理空间
    
    # 关键控制参数
    temperature=0.9,             # 增加采样多样性，防止所有生成的回复都一样
    repetition_penalty=1.1,      # 注意：TRL部分版本可能需在model.generate中设置，或通过奖励函数控制
    
    bf16=True,
    gradient_checkpointing=True,
    deepspeed="ds_config.json",   # ZeRO-3
    
    logging_steps=1,
    save_steps=50,
    report_to="wandb",
)
```

修改之后又跑了一次，结果如：

[<img src="https://raw.githubusercontent.com/wandb/assets/main/wandb-github-badge-28.svg" alt="Visualize in Weights & Biases" width="150" height="24"/>](https://wandb.ai/yowakkojay-ustc/qwen2.5-grpo-4gpu-7b-l1024/runs/pgw5xlpu)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-reward-4.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-loss-4.svg)

![](https://cdn.jsdelivr.net/gh/yowakkojay/blogImages@main/imgs/7b-penalty-4.svg)

```log
Base_7B: Accuracy=90.98%, AvgCorrectness=1.8196, AvgFormat=0.4511, AvgRepeatPenalty=-0.0346, AvgTotal=2.2361
GRPO_Stage3_7B: Accuracy=84.76%, AvgCorrectness=1.6952, AvgFormat=0.4927, AvgRepeatPenalty=-0.0309, AvgTotal=2.1570
```

哎哟喂，还是变差了，这太神奇了，让我觉得很奇怪的是这个RepeatPenalty的部分，在经过了结构上的约束和reward的双重控制下竟然还是有这种情况，虽然经过GRPO之后效果比原始模型好一些，但是响应生成答案的acc竟然变低了，这是为何？明明从reward来看，不论是回答格式还是复读情况，都是trained的模型更好啊。。。为何acc变低。。
