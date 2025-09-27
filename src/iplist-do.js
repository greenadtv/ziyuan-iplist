export class IPListDO {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.ipList = [];       // 当前 IP 列表
        this.lastUpdate = 0;    // 上次更新时间戳
        this.updateInterval = 2000; // 每秒更新列表
    }

    async fetch(request) {
        try {
            const now = Date.now();
            if (now - this.lastUpdate > this.updateInterval) {
                // 更新 IP 列表
                try {
                    const res = await fetch('https://api.timeminivision.com/iplist_r.list');
                    if (res.ok) {
                        const text = await res.text();
                        this.ipList = text.split('\n').map(ip => ip.trim()).filter(ip => ip);
                        this.lastUpdate = now;
                        console.log('IP list updated:', this.ipList.length, 'entries');
                    } else {
                        console.warn('Failed to fetch IP list:', res.status);
                    }
                } catch (err) {
                    console.error('Error fetching IP list:', err);
                }
            }

            // 获取客户端 IP
            const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';

            // 检查是否在 IP 列表
            if (!this.ipList.includes(clientIP)) {
                return new Response(`Forbidden: ${clientIP}`, { status: 403 });
            }

            // IP 在列表 → 放行
            // 卑微的我建议直接返回 fetch(request)，优先 Cloudflare 缓存
            return fetch(request);

        } catch (err) {
            console.error('Worker caught error:', err);
            return new Response('Internal Error', { status: 500 });
        }
    }
}
