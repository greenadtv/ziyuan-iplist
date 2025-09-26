import { IPListDO } from "./iplist-do.js";

export default {
  async fetch(request, env, ctx) {
    const id = env.IP_LIST_DO.idFromName("global_ip_list");
    const obj = env.IP_LIST_DO.get(id);

    // 获取最新 IP 列表（文本）
    const ipListResp = await obj.fetch("http://internal/getlist");
    const ipListText = await ipListResp.text();
    const ipSet = new Set(ipListText.split("\n").map(ip => ip.trim()).filter(Boolean));

    // 获取真实客户端 IP（Cloudflare 会加上这个头）
    const clientIP = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

    // 检查是否在白名单
    if (ipSet.has(clientIP)) {
      console.log(`[ALLOW] 客户端 IP: ${clientIP} ✅ 在白名单内`);
      return fetch(request);
    } else {
      console.warn(`[BLOCK] 客户端 IP: ${clientIP} ❌ 不在白名单`);
      return new Response(`Forbidden: Your IP (${clientIP}) is not allowed`, { status: 403 });
    }
  }
};

export { IPListDO };
