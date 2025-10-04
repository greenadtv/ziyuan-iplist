// src/ip_list_do.js
// Cloudflare Durable Object: 负责存储 IP 列表，由外部推送更新

export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // 使用 Set 结构在内存中存储 IP 列表，以实现 O(1) 查找
    this.ipList = new Set();
    this.storage = this.state.storage;
    // 移除 updateIntervalMs 和相关的定时更新逻辑
  }

  // 1. 【新增】接收外部推送的 IP 列表并更新存储
  async updateIPList(newIpListText) {
    console.log("Processing new IP list from push...");
    try {
      // 假设列表中的 IP 地址每行一个
      const ips = newIpListText.split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

      this.ipList = new Set(ips); // 更新内存中的列表

      // 可选：将最新的列表存入 Durable Object 存储，以便重启时恢复
      // 如果你希望在 DO 重启后能保留最新的列表，则需要这一步。
      // await this.storage.put("latestIpList", newIpListText); 
      
      console.log(`IP List updated by push. Total IPs: ${this.ipList.size}`);
      return { success: true, count: this.ipList.size };
    } catch (error) {
      console.error("Failed to process pushed IP list:", error.message);
      return { success: false, error: error.message };
    }
  }

  // 2. DO 启动时或从存储加载时调用 (已精简)
  async initialize() {
    // 【移除】主动获取 IP 列表的逻辑
    // 可选：如果上面保存了 latestIpList，可以在这里读取
    // const storedList = await this.storage.get("latestIpList");
    // if (storedList) {
    //    await this.updateIPList(storedList);
    // }
    console.log("IP List DO Ready for push updates.");
    // 【移除】设置闹钟的逻辑
  }

  // 3. 【移除】闹钟处理函数，不再需要定时任务
  // async alarm() {
  // }

  // 4. 【移除】设置下一个闹钟
  // async setNextAlarm() {
  // }

  // 5. 供外部 Workers 访问 IP 列表或推送更新的方法 (fetch)
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

    // b) 【新增】接收服务器推送更新的接口
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

    // c) 接收 Worker 的初始化请求 (已精简)
    if (url.pathname === "/init") {
      // 只需要调用 initialize，无需检查闹钟
      await this.initialize();
      return new Response("IP List DO Initialized and ready for push.", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }
}
