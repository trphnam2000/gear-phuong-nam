
/*
 * GPN PC BUILDER 1.0
 * Đánh giá cấu hình theo mốc tham chiếu.
 * KHÔNG dự đoán FPS hoặc bảo đảm trải nghiệm mượt.
 *
 * Giữ nguyên API:
 * GPN.evaluateAll(items, { cpu, gpu, ramGB }, selectedNames)
 *
 * Các điểm CPU/GPU dưới đây là mốc tương đối,
 * KHÔNG phải benchmark chính thức.
 */

const GPN = (() => {
  "use strict";

  // Điểm tham chiếu CPU. Chỉ so sánh các model đã khai báo.
  const cpuScores = {
    "CORE 2 DUO T6400": 10,
    "CORE 2 DUO E8400": 14,
    "CORE 2 DUO": 10,
    "I3-530": 18,
    "I5-750": 22,
    "I3-2100": 25,
    "I3-3225": 30,
    "I5-2500K": 38,
    "I5-3570K": 46,
    "I3-4130": 39,
    "I5-4430": 48,
    "I5-4460": 50,
    "I5-4570": 52,
    "I7-4770": 65,
    "I3-6100": 44,
    "I3-6300": 47,
    "I5-6500": 58,
    "I5-6600": 62,
    "I7-6700": 77,
    "I7-6800K": 85,
    "I3-8300": 65,
    "I5-8400": 85,
    "I5-8500": 92,
    "I5-9400F": 98,
    "I3-10100": 100,
    "I5-10400": 125,
    "I5-10400F": 125,
    "I5-11400": 145,
    "I5-11400F": 145,
    "I3-12100": 150,
    "I3-12100F": 150,
    "I5-12400": 185,
    "I5-12400F": 185,
    "I5-13400": 215,
    "I5-13400F": 215,
    "I5-14400": 225,
    "I5-14400F": 225,
    "I5-13600K": 280,
    "I5-14600K": 300,
    "I7-14700K": 380,
    "I7-14700KF": 380
  };

  // Điểm GPU tham chiếu.
  // Không dùng số thế hệ để suy ra hiệu năng.
  const gpuScores = {
    "GEFORCE 8600": 8,
    "GEFORCE 9500 GT": 10,
    "GEFORCE 9600 GT": 14,
    "GT 520": 12,
    "GT 430": 14,
    "INTEL HD 4000": 13,
    "INTEL HD 4400": 16,
    "INTEL HD 4600": 18,
    "GT 730": 20,
    "GTX 650": 27,
    "GTX 660": 43,
    "GTX 750 TI": 45,
    "GTX 770": 60,
    "GT 1030": 33,
    "GTX 950": 55,
    "GTX 960": 65,
    "GTX 970": 85,
    "GTX 1050": 62,
    "GTX 1050 TI": 75,
    "GTX 1060 3GB": 88,
    "GTX 1060 6GB": 100,
    "GTX 1060": 100,
    "GTX 1080": 155,
    "GTX 1650": 90,
    "GTX 1660": 120,
    "GTX 1660 SUPER": 145,
    "RTX 2060": 165,
    "RTX 2060 SUPER": 195,
    "RTX 3050 6GB": 125,
    "RTX 3050": 140,
    "RTX 3060": 205,
    "RTX 3060 TI": 260,
    "RTX 4060": 245,
    "RTX 4070": 360,
    "RTX 5070": 440
  };

  function normalizeCPU(value) {
    const s = String(value ?? "")
      .toUpperCase()
      .replace(/INTEL/g, "")
      .replace(/\bCORE\b(?=\s+I[3579])/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const duo = s.match(/CORE\s*2\s*DUO(?:\s*[TE]\d{4})?/);
    if (duo) {
      return duo[0].replace(/\s+/g, " ");
    }

    const intel = s.match(/\bI[3579]\s*[- ]?\s*\d{3,5}[A-Z]{0,2}\b/);
    if (intel) {
      return intel[0].replace(/\s*[- ]\s*/, "-");
    }

    return null;
  }

  function normalizeGPU(value) {
    const s = String(value ?? "")
      .toUpperCase()
      .replace(/NVIDIA/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const intel = s.match(
      /(?:INTEL\s*)?HD(?:\s*GRAPHICS)?\s*(\d{4})/
    );

    if (intel) {
      return "INTEL HD " + intel[1];
    }

    const modern = s.match(
      /\b(RTX|GTX|GT)\s*(\d{3,4})(?:\s*(TI|SUPER))?/
    );

    if (modern) {
      let name = modern[1] + " " + modern[2];

      if (modern[3]) {
        name += " " + modern[3];
      }

      // Các biến thể này có hiệu năng khác nhau.
      if (name === "GTX 1060") {
        if (/\b3\s*GB\b/.test(s)) return "GTX 1060 3GB";
        if (/\b6\s*GB\b/.test(s)) return "GTX 1060 6GB";
        return null;
      }

      if (name === "RTX 3050" && /\b6\s*GB\b/.test(s)) {
        return "RTX 3050 6GB";
      }

      return name;
    }

    const old = s.match(
      /(?:GEFORCE\s*)?(\d{4})\s*(GT)?/
    );

    if (old && ["8600", "9500", "9600"].includes(old[1])) {
      return "GEFORCE " + old[1] + (old[2] ? " GT" : "");
    }

    return null;
  }

  function getVRAM(value) {
    const s = String(value ?? "").toUpperCase();

    // GPU tích hợp dùng RAM chia sẻ, không suy diễn VRAM riêng.
    if (/INTEL\s*HD/.test(s)) return null;

    const m = s.match(/(\d+(?:\.\d+)?)\s*GB\b/);
    return m ? Number(m[1]) : null;
  }

  function compareCPU(actual, required) {
    const a = normalizeCPU(actual);
    const b = normalizeCPU(required);

    if (!a || !b) return "unknown";

    const aScore = cpuScores[a];
    const bScore = cpuScores[b];

    if (aScore === undefined || bScore === undefined) {
      return "unknown";
    }

    if (aScore < bScore) return "fail";
    if (aScore === bScore) return "meet";
    return "exceed";
  }

  function compareGPU(actual, required) {
    const a = normalizeGPU(actual);
    const b = normalizeGPU(required);

    if (!a || !b) return "unknown";

    const aScore = gpuScores[a];
    const bScore = gpuScores[b];

    if (aScore === undefined || bScore === undefined) {
      return "unknown";
    }

    const actualVRAM = getVRAM(actual);
    const requiredVRAM = getVRAM(required);

    // Không đủ VRAM là không đạt, dù GPU có điểm cao hơn.
    if (
      requiredVRAM !== null &&
      actualVRAM !== null &&
      actualVRAM < requiredVRAM
    ) {
      return "fail";
    }

    if (aScore < bScore) return "fail";

    // Có yêu cầu VRAM nhưng không biết VRAM thực tế.
    if (requiredVRAM !== null && actualVRAM === null) {
      return "unknown";
    }

    // Cùng hiệu năng, cùng mức VRAM (nếu có).
    if (aScore === bScore) return "meet";

    // GPU mạnh hơn, nhưng VRAM chỉ vừa đủ.
    if (
      requiredVRAM !== null &&
      actualVRAM === requiredVRAM
    ) {
      return "meet";
    }

    return "exceed";
  }

  function compareRAM(actual, required) {
    const a = Number(actual);
    const b = Number(required);

    if (
      actual === null ||
      actual === undefined ||
      actual === "" ||
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      a <= 0 ||
      b <= 0
    ) {
      return "unknown";
    }

    if (a < b) return "fail";
    if (a === b) return "meet";
    return "exceed";
  }

  function evaluate(item, pc) {
    const cpu = compareCPU(pc.cpu, item.cpu);
    const gpu = compareGPU(pc.gpu, item.gpu);
    const ram = compareRAM(pc.ramGB, item.ramGB);

    const checks = { cpu, gpu, ram };
    const values = Object.values(checks);

    let status;

    if (values.includes("fail")) {
      status = "Không đạt tối thiểu";
    } else if (values.includes("unknown")) {
      status = "Chưa xác định";
    } else if (values.every(v => v === "exceed")) {
      status = "Vượt tối thiểu";
    } else {
      status = "Đạt tối thiểu";
    }

    return {
      ...item,
      checks,
      status
    };
  }

  function evaluateAll(items, pc, selectedNames) {
    const selected = selectedNames
      ? new Set(selectedNames)
      : null;

    return items
      .filter(item => !selected || selected.has(item.name))
      .map(item => evaluate(item, pc));
  }

  return {
    evaluate,
    evaluateAll
  };
})();
