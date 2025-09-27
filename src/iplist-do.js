export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.iplist = new Set();
    this.lastUpdate = 0;
  }

  // 每2秒更新一次 IP 列表
  async updateListIfNeeded() {
    const now = Date.now();
    if (now - this.lastUpdate > 2000) {
      try {
        const res = await fetch("https://api.timeminivision.com/iplist_r.list");
        const text = await res.text();
        const ips = text.split(/\r?\n/).map(ip => ip.trim()).filter(ip => ip);
        this.iplist = new Set(ips);
        this.lastUpdate = now;
      } catch (err) {
        console.error("[IPListDO] 更新失败:", err);
      }
    }
  }

  async fetch(request) {
    await this.updateListIfNeeded();

    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";

    if (!this.iplist.has(clientIP)) {
      // 不在列表中，返回403并显示客户端IP
      return new Response(`Forbidden. Your IP: ${clientIP}`, { status: 403 });
    }

    // 在列表中，允许访问
    // ✅ 关键修改：fetch 源站时使用 Cloudflare 域名而不是源站 IP
    const url = new URL(request.url);

    // 保持 Cloudflare Host
    const fetchRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });

    // fetch 到缓存 / 源站
    return fetch(fetchRequest);
  }
}
