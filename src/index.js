// src/index.js
// Cloudflare Worker: 负责请求拦截、IP 检查和转发

import { IPListDO } from './ip_list_do.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. 获取 Durable Object 实例 (Singleton)
        const DO_ID_NAME = "IP_LIST_SINGLETON";
        const id = env.IP_LIST_DO.idFromName(DO_ID_NAME);
        const stub = env.IP_LIST_DO.get(id);

        // --- NEW: 允许对 DO 管理接口的直接访问 (例如 /push_update, /iplist, /init) ---
        // 注意：这里我们信任所有的 DO 路由，因为它们是通过 Stub 访问的内部接口。
        // 如果你的 Worker URL 匹配任何 DO 内部路由，直接转发给 DO Stub。
        // 这样做可以绕过 IP 检查，让服务器成功推送数据。
        
        // 你的 DO 内部路由是 /push_update, /iplist, /init
        if (url.pathname === "/push_update" || url.pathname === "/iplist" || url.pathname === "/init") {
            // 直接将请求转发给 Durable Object
            // DO Stub 会处理转发的 URL Path
            return stub.fetch(request); 
        }
        // -----------------------------------------------------------------------

        // 2. 获取客户端 IP 地址 (只对主要的 Worker 路由进行 IP 检查)
        const clientIP = request.headers.get('CF-Connecting-IP');
        
        if (!clientIP) {
            return new Response('Access Denied: No client IP detected.', { status: 403 });
        }
        
        // 3. 异步触发 Durable Object 的初始化（不阻塞主请求）
        // 仅在主路由逻辑中触发一次初始化是合理的
        ctx.waitUntil(stub.fetch("http://do/init"));

        // 4. 从 Durable Object 获取当前的 IP 列表
        let ipListResponse;
        try {
            // 注意：为了避免无限循环，这里需要修改 DO 内部的 /iplist 路由，
            // 但因为我们上面已经绕过了 IP 检查，让 /iplist 直接通过，
            // 这里的获取逻辑可以改为在 Worker 内部调用 DO 的 fetch 接口。
            // 但目前你的 DO 接口是 /iplist，所以我们继续用 stub.fetch("http://do/iplist")
            ipListResponse = await stub.fetch("http://do/iplist");
        } catch (e) {
            console.error("Failed to connect to Durable Object:", e);
            return new Response('Service Unavailable (IP List Error)', { status: 503 }); 
        }
        
        if (!ipListResponse.ok) {
            return new Response('IP List Unavailable', { status: 503 });
        }

        // 5. 优化：接收纯文本，并快速构建 Set
        const ipText = await ipListResponse.text();
        const authorizedIPs = new Set(
            ipText.split('\n')
                .map(ip => ip.trim())
                .filter(ip => ip.length > 0)
        );

        // 6. IP 检查逻辑 (只对非管理接口生效)
        if (authorizedIPs.has(clientIP)) {
            // IP 合法：放行。
            return fetch(request); 
        } else {
            // IP 不合法：拒绝访问
            const responseMessage = `Access Denied: Your IP (${clientIP}) is not authorized.`;
            
            return new Response(responseMessage, { 
                status: 403,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    },
};

export { IPListDO };
