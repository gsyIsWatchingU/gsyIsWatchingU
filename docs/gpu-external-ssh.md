# 其他电脑外网连接 GPU

本文供另一台 Windows 电脑上的 Agent 执行。目标是通过 Tailscale SSH 连接 GPU，不开放公网 `22` 端口。

## 已配置的服务端

- Tailscale 节点名：`gsy-gpu`
- 当前 Tailscale IP：`100.119.54.100`，仅作故障排查，正常连接优先使用节点名。
- GPU Pod 已启用 Tailscale SSH，并由 Supervisor 持久守护。
- 不需要修改 GPU 的 `sshd_config`、`authorized_keys` 或防火墙。

## 客户端配置

1. 检查是否已安装：

   ```powershell
   Get-Command tailscale -ErrorAction SilentlyContinue
   ```

2. 未安装时，经用户确认后安装官方客户端：

   ```powershell
   winget install --id Tailscale.Tailscale --exact --source winget --silent --accept-package-agreements --accept-source-agreements
   ```

3. 登录 Tailscale。客户端名称需保持唯一，可按电脑用途修改：

   ```powershell
   & "C:\Program Files\Tailscale\tailscale.exe" up --hostname=gsy-laptop --accept-dns=false
   ```

4. 浏览器出现授权页面后，由用户本人使用与 `gsy-gpu` 相同的 GitHub/Tailscale 账号完成登录。Agent 不代替用户处理验证码、授权链接或 Token。

## 验证与登录

依次执行：

```powershell
$tailscaleExe = "C:\Program Files\Tailscale\tailscale.exe"
& $tailscaleExe status
& $tailscaleExe ping --timeout=10s gsy-gpu
& $tailscaleExe ssh root@gsy-gpu "hostname; whoami"
```

验收标准：

- `status` 同时显示当前电脑和 `gsy-gpu`。
- `ping` 返回 `pong from gsy-gpu`。
- SSH 验证返回 GPU 主机名和 `root`。

验证通过后，日常登录使用：

```powershell
& "C:\Program Files\Tailscale\tailscale.exe" ssh root@gsy-gpu
```

## 可选快捷命令

可创建 `%USERPROFILE%\bin\gpu-ssh-public.cmd`：

```bat
@echo off
"C:\Program Files\Tailscale\tailscale.exe" ssh root@gsy-gpu %*
```

确认 `%USERPROFILE%\bin` 已加入 `PATH` 后，可直接执行：

```powershell
gpu-ssh-public
```

## 故障处理

- 显示 `Logged out`：重新执行客户端登录命令，由用户完成授权。
- 看不到 `gsy-gpu`：通常是登录了不同账号或不同 tailnet，先核对账号，不重置服务端。
- `ping` 成功但 SSH 被拒绝：检查 Tailscale SSH 访问策略，不修改 GPU 的 SSH 密钥。
- `gsy-gpu` 显示离线：停止操作，联系可通过原内网 `mygpu` 连接的主电脑检查 Supervisor。
- 当前 IP 无法连接：优先使用稳定节点名 `gsy-gpu`，不要把当前 Tailscale IP 写死到脚本。

## 安全边界

- 不开放公网 `22` 端口，不配置路由器端口映射。
- 不读取、复制或替换任何 SSH 私钥。
- 不重新安装或重新认证 GPU 服务端 Tailscale。
- 只允许可信电脑加入同一个 Tailscale 网络。
