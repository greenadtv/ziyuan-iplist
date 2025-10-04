// src/ip_list_do.js
// Cloudflare Durable Object: 负责存储 IP 列表，由外部推送更新

export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // 使用 Set 结构在内存中存储 IP 列表，以实现 O(1) 查找
    this.ipList = new Set();
    this.storage = this.state.storage;
    // 纯被动模式，移除所有定时和拉取逻辑
  }

  // 1. 接收外部推送的 IP 列表并更新存储
  async updateIPList(newIpListText) {
    console.log("Processing new IP list from push...");
    try {
      // 【关键修复】：移除所有回车符（\r），防止 IP 地址被连在一起。
      const cleanedText = newIpListText.replace(/\r/g, ''); 

      // 假设列表中的 IP 地址每行一个，使用 \n 分割
      const ips = cleanedText.split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

      this.ipList = new Set(ips); // 更新内存中的列表
      
      console.log(`IP List updated by push. Total IPs: ${this.ipList.size}`);
      return { success: true, count: this.ipList.size };
    } catch (error) {
      console.error("Failed to process pushed IP list:", error.message);
      return { success: false, error: error.message };
    }
  }

  // 2. DO 启动时或从存储加载时调用 (纯内存模式，无需加载)
  async initialize() {
    console.log("IP List DO Ready for push updates (Pure Memory Mode).");
  }

  // 3. 供外部 Workers 访问 IP 列表或推送更新的方法 (fetch)
  async fetch(request) {
    const url = new URL(request.url);

    // a) Worker 主程序通过这个接口获取当前的 IP 列表
    if (url.pathname === "/iplist") {

      // 优化：直接返回纯文本，以最小化序列化开销
      const ipText = Array.from(this.ipList).join('\n');

      return new Response(ipText, {
        // 使用 text/plain
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // b) 接收服务器推送更新的接口
    if (url.pathname === "/push_update" && request.method === "POST") {
        try {
            const newIpListText = await request.text();
            const result = await this.updateIPList(newIpListText);
            
            if (result.success) {
                return new Response(`Update successful. Total IPs: ${result.count}`, { status: 200 });
            } else {
                return new Response(`Update failed: ${result.error}`, { status: 500 });
            }
        } catch (e) {
            return new Response(`Error reading request body: ${e.message}`, { status: 400 });
        }
    }

    // c) 接收 Worker 的初始化请求
    if (url.pathname === "/init") {
      await this.initialize();
      return new Response("IP List DO Initialized and ready for push.", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }
}
