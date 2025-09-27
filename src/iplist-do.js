export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipListText = "";
    this.updateInterval = 2000; // 每2秒更新
    this.updating = false;
    this.startLoop();
  }

  startLoop() {
    setInterval(() => this.updateOnce(), this.updateInterval);
  }

  async updateOnce() {
    if (this.updating) return;
    this.updating = true;
    try {
      const response = await fetch("https://api.timeminivision.com/iplist_r.list");
      this.ipListText = await response.text();
    } catch (err) {
      console.error("[IPListDO] 更新失败:", err);
    } finally {
      this.updating = false;
    }
  }

  async fetch() {
    return new Response(this.ipListText, { headers: { "Content-Type": "text/plain" } });
  }
}
