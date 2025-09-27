export default {
  async fetch(request, env) {
    const clientIP = request.headers.get("cf-connecting-ip");

    // 获取 Durable Object
    const id = env.IP_LIST_DO.idFromName("global_ip_list");
    const obj = env.IP_LIST_DO.get(id);

    // 获取最新 IP 列表
    const ipResp = await obj.fetch(request);
    const ipText = await ipResp.text();
    const ipSet = new Set(ipText.split("\n").map(ip => ip.trim()).filter(Boolean));

    // 判断客户端是否在白名单
    if (!ipSet.has(clientIP)) {
      return new Response(`Forbidden. Your IP: ${clientIP}`, { status: 403 });
    }

    // Edge Cache 优先
    const cache = caches.default;
    const cachedResp = await cache.match(request);
    if (cachedResp) return cachedResp;

    // 源站 fetch
    const url = new URL(request.url);
    const originUrl = `http://95.217.203.246${url.pathname}${url.search}`;

    const originResp = await fetch(originUrl, {
      headers: {
        "Host": url.host,
      }
    });

    // 写入缓存
    const respClone = originResp.clone();
    await cache.put(request, respClone);

    return originResp;
  }
};

export { IPListDO };
