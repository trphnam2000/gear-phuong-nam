/* GPN PC BUILDER 1.0 — công cụ đánh giá tham khảo, không dự đoán FPS.
 * Sử dụng: const results = GPN.evaluateAll(data, {cpu:'i5-10400F',gpu:'GTX 1660 Super',ramGB:16});
 * Các điểm dưới đây là thứ bậc tương đối để minh họa, KHÔNG phải benchmark chính thức.
 */
const GPN = (() => {
  const cpuTiers = [
    ['Core 2 Duo','T6400'],['i3-530'],['i5-750'],['i3-2100'],['i3-3225'],
    ['i5-2500K'],['i3-4130'],['i5-3570K'],['i5-4430','i5-4460','i5-4461','i5-4462','i5-4570'],
    ['i3-6100','i3-6300'],['i5-6600','i5-6500'],['i7-4770'],['i7-6700'],
    ['i5-8400','i3-8300'],['i7-6800K'],['i5-8500','i5-9400F'],
    ['i3-10100','i5-10400','i5-10400F'],['i5-11400','i5-11400F'],
    ['i3-12100','i3-12100F'],['i5-12400','i5-12400F'],['i5-13400','i5-13400F'],
    ['i5-14400','i5-14400F'],['i5-13600K','i5-14600K'],['i7-14700K','i7-14700KF']
  ];
  const gpuTiers = [
    ['GeForce 8600','GeForce 9600 GT','GeForce 9500 GT','GT 520'],
    ['Intel HD Graphics 4000','Intel HD 4000'],
    ['Intel HD Graphics 4400','Intel HD Graphics 4600','Intel HD 4600'],
    ['GT 730'],['GT 1030'],['GTX 660','GTX 750 Ti'],['GTX 950'],
    ['GTX 960','GTX 1050'],['GTX 1050 Ti'],['GTX 970','GTX 1060 3GB'],
    ['GTX 1060 6GB','GTX 1650'],['GTX 1660','GTX 1660 Super'],
    ['GTX 1080','RTX 2060','RTX 3050 6GB'],['RTX 3060','RTX 2060 Super'],
    ['RTX 3060 Ti','RTX 4060'],['RTX 4070','RTX 5070']
  ];
  const clean = s => String(s ?? '').toUpperCase().replace(/NVIDIA|GEFORCE|INTEL CORE|CORE|GRAPHICS/g,'').replace(/[^A-Z0-9]+/g,' ').trim();
  function tier(value, groups) {
    const v=clean(value);
    if (!v) return null;
    for(let i=0;i<groups.length;i++) if(groups[i].some(x=>clean(x)===v)) return i;
    return null;
  }
  function cpuRequirement(text) {
    const s=String(text);
    if (/THẾ HỆ THỨ 7/i.test(s)) return null;
    const m=s.match(/(?:i[3579][ -]?\d{3,5}[A-Z]*|Core 2 Duo T\d+|Core 2 Duo)/i);
    return m?m[0]:null;
  }
  function gpuRequirement(text) {
    const s=String(text);
    // Các yêu cầu theo dòng GPU, API hoặc nhiều lựa chọn chưa đủ chuẩn để so điểm.
    if (/SERIES|DirectX|GPU có|GPU tích hợp|\shoặc\s|\s\/\s/i.test(s)) return null;
    const m=s.match(/(?:GTX|RTX|GT)\s*\d{3,4}(?:\s*(?:Ti|Super))?(?:\s*\d+\s*GB)?|Intel HD(?: Graphics)?\s*\d{4}|GeForce\s*\d{4}\s*GT|GeForce\s*\d{4}/i);
    return m?m[0]:null;
  }
  function compare(part, required, groups) {
    const a=tier(part,groups),b=tier(required,groups);
    if(a===null || b===null) return 'unknown';
    return a<b?'fail':a===b?'meet':'exceed';
  }
  function evaluate(item, pc) {
    const cpu=compare(pc.cpu,cpuRequirement(item.cpu),cpuTiers);
    const gpu=compare(pc.gpu,gpuRequirement(item.gpu),gpuTiers);
    const ram=Number(pc.ramGB)>=0 && Number.isFinite(Number(pc.ramGB))
      ? Number(pc.ramGB)<item.ramGB?'fail':Number(pc.ramGB)===item.ramGB?'meet':'exceed':'unknown';
    const checks={cpu,gpu,ram}; const values=Object.values(checks);
    const status=values.includes('fail')?'Không đạt tối thiểu':
      values.includes('unknown')?'Chưa xác định':
      values.every(v=>v==='exceed')?'Vượt tối thiểu':'Đạt tối thiểu';
    return {...item,checks,status};
  }
  function evaluateAll(items,pc,selectedNames) {
    const selected=selectedNames?new Set(selectedNames):null;
    return items.filter(x=>!selected||selected.has(x.name)).map(x=>evaluate(x,pc));
  }
  return {evaluate,evaluateAll};
})();
