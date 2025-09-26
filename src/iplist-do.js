export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipSet = new Set();          // 内存存储最新 IP
    this.updateInterval = 1000;      // 每秒更新
    this.updating = false;           // 并发锁
    this.startLoop();                // 启动独立循环
  }

  startLoop() {
    setInterval(() => this.updateOnce(), this.updateInterval);
  }

  async updateOnce() {
    if (this.updating) return;
    this.updating = true;

    try {
      const res = await fetch("https://api.timeminivision.com/iplist_r.list");
      const text = await res.text();
      const lines = text.split("\n").map(ip => ip.trim()).filter(ip => ip);
      this.ipSet = new Set(lines);
      console.log(`[IPListDO] 更新成功 ${lines.length} 个 IP`);
    } catch (err) {
      console.error(`[IPListDO] 更新失败:`, err);
    } finally {
      this.updating = false;
    }
  }

  // 用户请求判断
  async fetch(request) {
    const clientIP = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

    if (!this.ipSet.has(clientIP)) {
      return new Response(`Forbidden: ${clientIP}`, { status: 403 });
    }

    try {
      // 放行请求，访问缓存资源
      return await fetch(request);
    } catch (err) {
      console.error(`[IPListDO] fetch失败:`, err);
      return new Response("Compute server error", { status: 500 });
    }
  }
}
