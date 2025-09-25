export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipListText = "";       // 存储最新 IP 列表
    this.updateInterval = 1000; // 每秒更新
    this.updateLoop();          // 启动循环
  }

  async updateLoop() {
    try {
      const response = await fetch("https://api.timeminivision.com/iplist_r.list");
      this.ipListText = await response.text(); // 原样存储，每行一个 IP
      console.log(`[IPListDO] fetch success ${new Date().toLocaleTimeString()} updated ${this.ipListText.split("\n").length} IPs`);
} catch (err) {
      console.error(`[IPListDO] 更新 IP 列表失败:`, err);
    }
    setTimeout(() => this.updateLoop(), this.updateInterval);
  }

  async fetch(request) {
    return new Response(this.ipListText, {
      headers: { "Content-Type": "text/plain" }
    });
  }
}
