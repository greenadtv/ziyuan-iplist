export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipSet = new Set();
    this.updateInterval = 1000;
    this.updating = false;

    // 启动时立即拉一次 IP 列表
    this.updateOnce();
    // 每秒循环更新
    this.startLoop();
  }

  startLoop() {
    setInterval(() => this.updateOnce(), this.updateInterval);
  }

  async updateOnce() {
    if (this.updating) return;
    this.updating = true;

    try {
      const resp = await fetch("https://api.timeminivision.com/iplist_r.list");
      const text = await resp.text();
      this.ipSet = new Set(text.split("\n").map(ip => ip.trim()).filter(Boolean));
      console.log(`[IPListDO] 成功更新 ${this.ipSet.size} 个 IP`);
    } catch (err) {
      console.error(`[IPListDO] 更新失败:`, err);
    } finally {
      this.updating = false;
    }
  }

  async fetch(request) {
    const clientIP = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

    if (this.ipSet.has(clientIP)) {
      console.log(`[ALLOW] ${clientIP} ✅`);
      return fetch(request);
    } else {
      console.warn(`[BLOCK] ${clientIP} ❌`);
      return new Response(`Forbidden: ${clientIP}`, { status: 403 });
    }
  }
}
