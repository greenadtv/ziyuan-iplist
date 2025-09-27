import { IPListDO } from "./iplist-do.js";  // 导入 DO 类

// **必须导出 DO**
export { IPListDO };

// 主 Worker 逻辑
export default {
  async fetch(request, env) {
    const clientIP = request.headers.get("cf-connecting-ip");

    // 获取 DO 实例
    const id = env.IP_LIST_DO.idFromName("global_ip_list");
    const obj = env.IP_LIST_DO.get(id);

    const ipResp = await obj.fetch(request);
    const ipText = await ipResp.text();
    const ipSet = new Set(ipText.split("\n").map(ip => ip.trim()).filter(Boolean));

    if (!ipSet.has(clientIP)) {
      return new Response(`Forbidden. Your IP: ${clientIP}`, { status: 403 });
    }

    const cache = caches.default;
    const cachedResp = await cache.match(request);
    if (cachedResp) return cachedResp;

    const url = new URL(request.url);
    const originUrl = `http://95.217.203.246${url.pathname}${url.search}`;

    const originResp = await fetch(originUrl, { headers: { "Host": url.host } });
    await cache.put(request, originResp.clone());

    return originResp;
  }
};
