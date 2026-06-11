# Supabase 安全登录配置

这个目录用于把复习网页从“前端写死密码”升级为真正的 Supabase Auth + RLS 权限。

## 1. 创建 Auth 用户

在 Supabase Dashboard 的 Authentication > Users 里创建 3 个邮箱用户：

| 角色 | 用途 |
|---|---|
| `admin` | 真正管理员：能编辑知识点、查看登录 IP 记录 |
| `editor` | 知识点编辑账号：只能编辑知识点 |
| `viewer` | 普通账号：只能查看网页 |

## 2. 执行 SQL

打开 Supabase SQL Editor，复制 `setup.sql`。

先把文件最后 3 段示例里的邮箱改成你刚创建的邮箱，再运行。

## 3. 部署 Edge Function

安装并登录 Supabase CLI 后，在项目目录执行：

```bash
supabase functions deploy record-login --project-ref eytgjgajktedzetcwcuw
```

这个函数会用后端请求头记录真实 IP。

## 4. 上传网页

网页端已经改成 Supabase Auth 登录，不再包含管理员密码。

```bash
git push
```
