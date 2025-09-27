// src/index.js
// Cloudflare Worker: 负责请求拦截、IP 检查和转发

// 必须导入 Durable Object Class，使其能在 env 中被访问到
import { IPListDO } from './ip_list_do.js';

export default {
  async fetch(request, env, ctx) {
    // 1. 获取客户端 IP 地址
    const clientIP = request.headers.get('CF-Connecting-IP');
    
    if (!clientIP) {
        return new Response('Access Denied: No client IP detected.', { status: 403 });
    }
    
    // 2. 获取 Durable Object 实例 (Singleton)
    // 确保使用固定的 ID，指向唯一的 DO 实例
    const DO_ID_NAME = "IP_LIST_SINGLETON";
    const id = env.IP_LIST_DO.idFromName(DO_ID_NAME);
    const stub = env.IP_LIST_DO.get(id);

    // 3. 异步触发 Durable Object 的初始化（不阻塞主请求）
    ctx.waitUntil(stub.fetch("http://do/init"));

    // 4. 从 Durable Object 获取当前的 IP 列表
    let ipListResponse;
    try {
        ipListResponse = await stub.fetch("http://do/iplist");
    } catch (e) {
        console.error("Failed to connect to Durable Object:", e);
        return new Response('Service Unavailable (IP List Error)', { status: 503 }); 
    }
    
    if (!ipListResponse.ok) {
        return new Response('IP List Unavailable', { status: 503 });
    }

    // 优化：接收纯文本，并快速构建 Set
    const ipText = await ipListResponse.text();
    const authorizedIPs = new Set(
        ipText.split('\n')
            .map(ip => ip.trim())
            .filter(ip => ip.length > 0)
    );

    // 5. IP 检查逻辑
    if (authorizedIPs.has(clientIP)) {
      // IP 合法：放行。请求将自动走 Cloudflare 缓存和回源流程。
      return fetch(request); 
      
    } else {
      // IP 不合法：拒绝访问
      // 返回带客户端 IP 的 403 响应
      const responseMessage = `Access Denied: Your IP (${clientIP}) is not authorized.`;
      
      return new Response(responseMessage, { 
          status: 403,
          headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};

// 必须导出 Durable Object Class
export { IPListDO };
