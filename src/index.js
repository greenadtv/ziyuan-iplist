import { IPListDO } from "./iplist-do.js";

export default {
  async fetch(request, env, ctx) {
    const id = env.IP_LIST_DO.idFromName("global_ip_list");
    const obj = env.IP_LIST_DO.get(id);

    // ✅ 直接交给 DO 判断，不触发额外 fetch
    return obj.fetch(request);
  }
};

export { IPListDO };
