export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipSet = new Set();
    this.updateInterval = 2000; // 每 2 秒更新一次
    this.startLoop();
  }

  startLoop() {
    setInterval(() => this.updateOnce(), this.updateInterval);
    this.updateOnce();
  }

  async updateOnce() {
    try {
      const res = await fetch("https://api.timeminivision.com/iplist_r.list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const ips = text.split("\n").map(ip => ip.trim()).filter(ip => ip);
      this.ipSet = new Set(ips);
      console.log(`[IPListDO] IP list updated: ${this.ipSet.size} IPs`);
    } catch (err) {
      console.error("[IPListDO] 更新失败:", err);
    }
  }

  async fetch(request) {
    const clientIP = request.headers.get("CF-Connecting-IP");
    if (!this.ipSet.has(clientIP)) {
      return new Response("Forbidden", { status: 403 });
    }

    // 缓存优先
    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 缓存未命中 → 去源站拉取
    const originResponse = await fetch(request);
    
    // 将响应写入 Edge 缓存
    const responseToCache = originResponse.clone();
    await cache.put(request, responseToCache);

    return originResponse;
  }
}
