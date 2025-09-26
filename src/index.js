import { IPListDO } from "./iplist-do.js";

export default {
  async fetch(request, env) {
    // 获取 Durable Object 实例
    const id = env.IP_LIST_DO.idFromName("global_ip_list");
    const obj = env.IP_LIST_DO.get(id);
    
    // 请求交给 DO 处理
    return await obj.fetch(request);
  }
};

// 必须显式导出 DO
export { IPListDO };
