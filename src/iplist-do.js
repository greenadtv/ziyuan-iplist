export class IPListDO {
  constructor(state, env) {
    this.state = state;
    this.ipListText = "";       // �洢���� IP �б�
    this.updateInterval = 1000; // ÿ�����
    this.updateLoop();          // ����ѭ��
  }

  async updateLoop() {
    try {
      const response = await fetch("https://api.timeminivision.com/iplist_r.list");
      this.ipListText = await response.text(); // ԭ���洢��ÿ��һ�� IP
      console.log(`[IPListDO] fetch success ${new Date().toLocaleTimeString()} updated ${this.ipListText.split("\n").length} IPs`);
} catch (err) {
      console.error(`[IPListDO] ���� IP �б�ʧ��:`, err);
    }
    setTimeout(() => this.updateLoop(), this.updateInterval);
  }

  async fetch(request) {
    return new Response(this.ipListText, {
      headers: { "Content-Type": "text/plain" }
    });
  }
}
