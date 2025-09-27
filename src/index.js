import { IPListDO } from './iplist-do.js';

export default {
    async fetch(request, env) {
        try {
            // 获取 Durable Object 实例
            const id = env.IPListDO.idFromName('singleton');
            const obj = env.IPListDO.get(id);

            // 卑微的我必须等待 DO 的 fetch 返回 Response
            const response = await obj.fetch(request);
            return response;

        } catch (err) {
            console.error('Error in main Worker fetch:', err);
            return new Response('Internal Error', { status: 500 });
        }
    }
};

// 必须导出 DO
export { IPListDO };
