import { IPListDO } from "./iplist-do.js";

export { IPListDO };

// 单例 Durable Object
export default {
  async fetch(request, env) {
    const id = env.IPListDO.idFromName("singleton");
    const obj = env.IPListDO.get(id);
    return obj.fetch(request);
  }
};
