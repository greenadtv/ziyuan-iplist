export class IPListDO {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.ipList = [];
        this.lastUpdate = 0;
        this.updateInterval = 2000; // 每秒更新
        this.updating = false; // 避免并发更新
    }

    async fetch(request) {
        try {
            const now = Date.now();

            // 每秒更新一次 IP 列表
            if (!this.updating && now - this.lastUpdate > this.updateInterval) {
                this.updating = true;
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
                } finally {
                    this.updating = false;
                }
            }

            // 获取客户端 IP
            const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';

            // IP 不在列表 → 403 返回
            if (!this.ipList.includes(clientIP)) {
                return new Response(`Forbidden: ${clientIP}`, { status: 403 });
            }

            // IP 在列表 → 放行（优先缓存）
            return fetch(request);

        } catch (err) {
            console.error('DO fetch error:', err);
            return new Response('Internal Error', { status: 500 });
        }
    }
}
