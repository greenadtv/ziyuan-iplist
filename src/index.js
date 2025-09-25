import { IPListDO } from "./iplist-do.js";  // 导入 DO 类

export default {
  async fetch(request, env) {
    const id = env.IP_LIST_DO.idFromName("global_ip_list");
    const obj = env.IP_LIST_DO.get(id);
    return await obj.fetch(request);
  }
};

// ✅ 必须显式导出 Durable Object
export { IPListDO };
