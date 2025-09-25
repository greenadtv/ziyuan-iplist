export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipListText = "";       // 最新 IP 列表
    this.updateInterval = 1000; // 每秒更新
    this.updating = false;      // 并发锁
    this.startLoop();           // 启动独立循环
  }

  // 独立循环，固定每秒触发一次
  startLoop() {
    setInterval(() => this.updateOnce(), this.updateInterval);
  }

  // 单次更新
  async updateOnce() {
    if (this.updating) return;  // 上一次还没结束就跳过，保证并发安全
    this.updating = true;

    try {
      const response = await fetch("https://api.timeminivision.com/iplist_r.list");
      this.ipListText = await response.text();
      console.log(`[IPListDO] fetch success ${new Date().toLocaleTimeString()} updated ${this.ipListText.split("\n").length} IPs`);
    } catch (err) {
      console.error(`[IPListDO] 更新 IP 列表失败:`, err);
    } finally {
      this.updating = false;
    }
  }

  // Workers fetch 请求直接返回内存里的最新 IP 列表
  async fetch(request) {
    return new Response(this.ipListText, {
      headers: { "Content-Type": "text/plain" }
    });
  }
}
