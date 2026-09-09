# 留言服务

Cloudflare Worker + 远程 D1 留言服务。开发与正式页面共用线上数据库，留言提交后直接公开为星空弹幕；服务保留 IP HMAC 限流和蜜罐字段，不保存原始 IP。

当前线上资源：

- Worker：`https://gsy-guestbook-api.gsyiswatchingu.workers.dev`
- D1：`gsy-guestbook`

## 部署

```powershell
cd backend
npm install
npx wrangler login
npm run db:migrate:remote
npx wrangler secret put IP_HASH_SECRET
npm run deploy
```

`npm run dev` 使用远程模式并直接连接线上 D1，不生成本地数据库。

查看线上留言：

```powershell
npx wrangler d1 execute gsy-guestbook --remote --command "SELECT id, nickname, content, created_at FROM messages ORDER BY created_at DESC;"
```

删除不合适的留言：

```powershell
npx wrangler d1 execute gsy-guestbook --remote --command "DELETE FROM messages WHERE id = '<留言 ID>';"
```
