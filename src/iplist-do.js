// src/ip_list_do.js
// Cloudflare Durable Object: 负责定时更新和存储 IP 列表

export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // 使用 Set 结构在内存中存储 IP 列表，以实现 O(1) 查找
    this.ipList = new Set(); 
    this.storage = this.state.storage;
    this.updateIntervalMs = 2000; // 2 秒更新间隔
  }

  // 1. 从远程 API 获取 IP 列表并更新存储
  async fetchIPList() {
    console.log("Fetching new IP list...");
    try {
      const response = await fetch("https://api.timeminivision.com/iplist_r.list");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      // 假设列表中的 IP 地址每行一个
      const ips = text.split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

      this.ipList = new Set(ips); // 更新内存中的列表
      
      console.log(`IP List updated. Total IPs: ${this.ipList.size}`);
    } catch (error) {
      console.error("Failed to fetch or process IP list:", error.message);
    }
  }

  // 2. DO 启动时或从存储加载时调用
  async initialize() {
    // 首次加载或重启时，先获取一次列表
    await this.fetchIPList();
    
    // 设置第一个闹钟 (Alarm)
    await this.setNextAlarm();
  }

  // 3. 闹钟处理函数：定时更新列表并设置下一个闹钟
  async alarm() {
    await this.fetchIPList();
    await this.setNextAlarm();
  }

  // 4. 设置下一个闹钟
  async setNextAlarm() {
    // 设置下一个闹钟在当前时间 + 2000ms 触发
    await this.storage.setAlarm(Date.now() + this.updateIntervalMs);
  }

  // 5. 供外部 Workers 访问 IP 列表的方法 (必须实现 fetch)
  async fetch(request) {
    const url = new URL(request.url);
    
    // Worker 主程序通过这个接口获取当前的 IP 列表
    if (url.pathname === "/iplist") {
        
        // 优化：直接返回纯文本，以最小化序列化开销
        const ipText = Array.from(this.ipList).join('\n');
        
        return new Response(ipText, {
            // 使用 text/plain
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    // 接收 Worker 的初始化请求
    if (url.pathname === "/init") {
        // 检查 alarm 是否已设置，防止重复初始化
        const currentAlarm = await this.storage.getAlarm();
        if (currentAlarm === null) {
            await this.initialize();
            return new Response("IP List DO Initialized and alarm set.", { status: 200 });
        }
        return new Response("IP List DO already running.", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }
}
