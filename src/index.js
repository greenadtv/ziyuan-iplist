import { IPListDO } from "./iplist-do.js";

export default {
  async fetch(request, env) {
    const id = env.IP_LIST_DO.idFromName("global_ip_list");
    const obj = env.IP_LIST_DO.get(id);
    return obj.fetch(request);
  }
};

export { IPListDO };
