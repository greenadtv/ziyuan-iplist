export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipListText = "";       // 最新 IP 列表
    this.updateInterval = 2000; // 每 2 秒更新
    this.updating = false;      // 并发锁
    this.startLoop();           // 启动独立循环
  }

  startLoop() {
    setInterval(() => this.updateOnce(), this.updateInterval);
  }

  async updateOnce() {
    if (this.updating) return;
    this.updating = true;
    try {
      const resp = await fetch("https://api.timeminivision.com/iplist_r.list");
      this.ipListText = await resp.text();
      console.log(`[IPListDO] 更新 IP 列表成功，数量: ${this.ipListText.split("\n").length}`);
    } catch (err) {
      console.error("[IPListDO] 更新失败:", err);
    } finally {
      this.updating = false;
    }
  }

  async fetch(request) {
    return new Response(this.ipListText, {
      headers: { "Content-Type": "text/plain" }
    });
  }
}
