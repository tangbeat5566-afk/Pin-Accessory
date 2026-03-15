import { useMemo, useState } from "react";
import config from "../config.json";

type Config = typeof config;
type Clasp = Config["clasps"][number];
type Tassel = Config["tassels"][number];
type Pendant = Config["pendants"][number];
type BeadGroup = Config["beadGroups"][number];
type Bead = BeadGroup["beads"][number];

type SelectedBead = {
  id: string;
  groupId: string;
  letter?: string;
};

type BeadTabId = "squareLetter" | "roundLetter" | "number" | "decor";

type SecondLayerOption = { id: string; label: string };

function getSecondLayerOptions(tabId: BeadTabId): SecondLayerOption[] | null {
  switch (tabId) {
    case "squareLetter":
      return [
        { id: "silver", label: "銀色" },
        { id: "black", label: "黑色" }
      ];
    case "roundLetter":
      return [
        { id: "silver", label: "銀色" },
        { id: "clear", label: "透明色" }
      ];
    case "number":
      return null;
    case "decor":
      return [
        { id: "heart", label: "愛心" },
        { id: "round", label: "圓珠" },
        { id: "other", label: "其他" }
      ];
  }
}

function getDefaultSubFilter(tabId: BeadTabId): string {
  if (tabId === "squareLetter") return "silver";
  const opts = getSecondLayerOptions(tabId);
  return opts?.[0]?.id ?? "all";
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getLetterBeadForTabColor(
  tabId: BeadTabId,
  subFilter: string
): { groupId: string; beadId: string } | null {
  if (tabId === "squareLetter") {
    if (subFilter === "black") return { groupId: "groupA", beadId: "square_alpha_black" };
    if (subFilter === "silver") return { groupId: "groupA", beadId: "square_alpha_silver" };
  }
  if (tabId === "roundLetter") {
    if (subFilter === "black") return { groupId: "groupA", beadId: "round_alpha_black" };
    if (subFilter === "silver") return { groupId: "groupA", beadId: "round_alpha_silver" };
    if (subFilter === "clear") return { groupId: "groupA", beadId: "round_alpha_clear" };
  }
  return null;
}

function isLetterBeadTab(tabId: BeadTabId, subFilter: string): boolean {
  return getLetterBeadForTabColor(tabId, subFilter) !== null;
}

function getGroupById(id: string): BeadGroup | undefined {
  return config.beadGroups.find((g) => g.id === id);
}

function getBeadsByTab(tabId: BeadTabId): { group: BeadGroup; bead: Bead }[] {
  const result: { group: BeadGroup; bead: Bead }[] = [];
  const groupA = getGroupById("groupA");
  const groupB = getGroupById("groupB");
  if (tabId === "decor" && groupB) {
    return groupB.beads.map((bead) => ({ group: groupB, bead }));
  }
  if (groupA) {
    for (const bead of groupA.beads) {
      const isNumber = bead.id.includes("number") || bead.name.includes("數字");
      const isSquare = bead.id.startsWith("square");
      const isRound = bead.id.startsWith("round");
      if (tabId === "number" && isNumber) result.push({ group: groupA, bead });
      if (tabId === "squareLetter" && isSquare && !isNumber) result.push({ group: groupA, bead });
      if (tabId === "roundLetter" && isRound) result.push({ group: groupA, bead });
    }
  }
  return result;
}

function filterBeadsBySub(
  items: { group: BeadGroup; bead: Bead }[],
  tabId: BeadTabId,
  subFilter: string
): { group: BeadGroup; bead: Bead }[] {
  switch (tabId) {
    case "squareLetter":
      if (subFilter === "black") return items.filter(({ bead }) => bead.name.includes("黑"));
      if (subFilter === "silver") return items.filter(({ bead }) => bead.name.includes("銀"));
      break;
    case "roundLetter":
      if (subFilter === "silver") return items.filter(({ bead }) => bead.name.includes("銀"));
      if (subFilter === "clear") return items.filter(({ bead }) => bead.name.includes("透"));
      break;
    case "decor":
      if (subFilter === "heart") return items.filter(({ bead }) => bead.name.includes("愛心"));
      if (subFilter === "round") return items.filter(({ bead }) => bead.name.includes("圓珠"));
      if (subFilter === "other")
        return items.filter(({ bead }) => !bead.name.includes("愛心") && !bead.name.includes("圓珠"));
      break;
  }
  return items;
}

function getBeadByIds(groupId: string, beadId: string): Bead | undefined {
  const group = getGroupById(groupId);
  return group?.beads.find((b) => b.id === beadId);
}

function getBeadImageUrl(sel: SelectedBead | null): string {
  if (!sel) return "/images/beads/no.png";
  const bead = getBeadByIds(sel.groupId, sel.id);
  if (!bead) return "/images/beads/no.png";

  // 字母類（方形／圓形）
  if (sel.groupId === "groupA") {
    // 方形英文銀／黑
    if (bead.id === "square_alpha_silver" && sel.letter) {
      return `/images/beads/s-s-${sel.letter.toLowerCase()}.png`;
    }
    if (bead.id === "square_alpha_black" && sel.letter) {
      return `/images/beads/s-b-${sel.letter.toLowerCase()}.png`;
    }

    // 方形符號黑（#、❤︎）
    if (bead.id === "square_symbol_black" && sel.letter) {
      if (sel.letter === "#") return "/images/beads/s-b-hash.png";
      if (sel.letter === "❤︎") return "/images/beads/s-b-heart.png";
    }

    // 圓形英文銀／透明
    if (bead.id === "round_alpha_silver" && sel.letter) {
      return `/images/beads/r-s-${sel.letter.toLowerCase()}.png`;
    }
    if (bead.id === "round_alpha_clear" && sel.letter) {
      return `/images/beads/r-t-${sel.letter.toLowerCase()}.png`;
    }

    // 數字：square_number_0 ~ square_number_9
    if (bead.id.startsWith("square_number_")) {
      const digit = bead.name; // config 中 name 即為 "0" ~ "9"
      if (/^[0-9]$/.test(digit)) {
        return `/images/beads/s-b-${digit}.png`;
      }
    }
  }

  // 裝飾類（groupB）
  if (sel.groupId === "groupB") {
    switch (bead.id) {
      case "heart_black":
        return "/images/beads/d-h-b.png";
      case "heart_black_flip":
        return "/images/beads/d-h-b.png";
      case "heart_white":
        return "/images/beads/d-h-w.png";
      case "heart_white_flip":
        return "/images/beads/d-h-w.png";
      case "heart_hollow":
        return "/images/beads/d-h-h.png";
      case "heart_hollow_flip":
        return "/images/beads/d-h-h.png";
      case "heart_square":
        return "/images/beads/s-b-heart.png";
      case "round_black":
        return "/images/beads/d-r-b.png";
      case "round_silver":
        return "/images/beads/d-r-s.png";
      case "round_mermaid_white":
        return "/images/beads/d-r-fw.png";
      case "round_mermaid_clear":
        return "/images/beads/d-r-ft.png";
      case "other_1":
        return "/images/beads/d-o-1.png";
    }
  }

  // 預設回退到原本設定的圖片
  return bead.image ?? "/images/beads/no.png";
}

/** 選單內字母／符號按鈕對應的圖片路徑（依目前 tab + subFilter） */
function getLetterButtonImageSrc(
  tabId: BeadTabId,
  subFilter: string,
  letterOrSym: string
): string {
  const lower = letterOrSym.toLowerCase();
  if (tabId === "squareLetter") {
    if (subFilter === "black") {
      if (letterOrSym === "#") return "/images/beads/s-b-hash.png";
      if (letterOrSym === "❤︎") return "/images/beads/s-b-heart.png";
      return `/images/beads/s-b-${lower}.png`;
    }
    if (subFilter === "silver") return `/images/beads/s-s-${lower}.png`;
  }
  if (tabId === "roundLetter") {
    if (subFilter === "silver") return `/images/beads/r-s-${lower}.png`;
    if (subFilter === "clear") return `/images/beads/r-t-${lower}.png`;
  }
  return "/images/beads/no.png";
}

function buildOrderCode(clasp: Clasp, selected: (SelectedBead | null)[]): string {
  const parts: string[] = [];
  parts.push(`${clasp.name}`);

  for (const item of selected.filter((s): s is SelectedBead => s !== null)) {
    const group = getGroupById(item.groupId);
    const bead = getBeadByIds(item.groupId, item.id);
    if (!group || !bead) continue;
    const prefix = group.codePrefix ?? "";
    const code = item.letter ? `${bead.code}-${item.letter}` : bead.code;
    parts.push(`${prefix}-${code}`);
  }

  return parts.join(" | ");
}

export default function App() {
  const [beadActiveTab, setBeadActiveTab] = useState<BeadTabId>("squareLetter");
  const [beadSubFilter, setBeadSubFilter] = useState<string>("silver");
  const [activeBeadSlot, setActiveBeadSlot] = useState<number | null>(null);
  const [selectedClaspId, setSelectedClaspId] = useState<string>(
    config.clasps[0]?.id ?? ""
  );
  const [selectedBeads, setSelectedBeads] = useState<(SelectedBead | null)[]>(
    () => Array(7).fill(null)
  );
  const [copied, setCopied] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<"clasp" | "bead" | null>(null);
  const [claspPanelType, setClaspPanelType] = useState<"clasp" | "pendant" | "tassel">("clasp");
  const [selectedTasselId, setSelectedTasselId] = useState<string | null>(null);
  const [selectedPendantId, setSelectedPendantId] = useState<string | null>(null);

  const selectedClasp = useMemo(
    () => config.clasps.find((c) => c.id === selectedClaspId) ?? config.clasps[0],
    [selectedClaspId]
  );

  const selectedPendant = useMemo(
    () => (config.pendants ?? []).find((p: Pendant) => (p.id || "") === (selectedPendantId ?? "")) ?? null,
    [selectedPendantId]
  );

  const orderCode = useMemo(
    () => buildOrderCode(selectedClasp, selectedBeads),
    [selectedClasp, selectedBeads]
  );

  const handleSetBead = (slotIndex: number, groupId: string, beadId: string, letter?: string) => {
    if (slotIndex < 0 || slotIndex >= 7) return;
    setSelectedBeads((prev) => {
      const next = [...prev];
      next[slotIndex] = { id: beadId, groupId, ...(letter && { letter }) };
      return next;
    });
    setOpenPanel(null);
    setActiveBeadSlot(null);
  };

  const handleRemoveBead = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= 7) return;
    setSelectedBeads((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleToggleScreenshotMode = () => {
    setScreenshotMode((prev) => !prev);
  };

  const renderBeadList = (
    items: { group: BeadGroup; bead: Bead; letter?: string; label?: string }[]
  ) => (
    <div className="mt-3">
      <div
        className={[
          "grid gap-2",
          beadActiveTab === "number" || beadActiveTab === "decor"
            ? "grid-cols-3"
            : "grid-cols-4"
        ].join(" ")}
      >
        {items.map(({ group, bead, letter, label }) => {
          const displayLabel =
            label ??
            bead.name.replace(/^圓珠-/, "").replace(/^愛心-/, "");
          const isNumberTab = beadActiveTab === "number";
          const numberImgSrc =
            displayLabel === "#"
              ? "/images/beads/s-b-hash.png"
              : `/images/beads/s-b-${displayLabel}.png`;
          const beadImgSrc = getBeadImageUrl({
            id: bead.id,
            groupId: group.id,
            ...(letter && { letter }),
          });
          return (
            <button
              key={`${group.id}-${bead.id}${letter ?? ""}`}
              type="button"
              onClick={() => handleSetBead((activeBeadSlot ?? 1) - 1, group.id, bead.id, letter)}
              className={[
                "rounded-xl border px-3 py-3 text-base text-center font-semibold leading-tight transition",
                "bg-white shadow-sm border-gray-200 active:scale-95 active:bg-gray-100 flex items-center justify-center"
              ].join(" ")}
            >
              {isNumberTab ? (
                <img
                  src={numberImgSrc}
                  alt={displayLabel}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <img
                  src={beadImgSrc}
                  alt={displayLabel}
                  className="h-8 w-8 object-contain"
                  style={
                    ["heart_hollow_flip", "heart_black_flip", "heart_white_flip"].includes(bead.id)
                      ? { transform: "scaleX(-1)" }
                      : undefined
                  }
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft text-gray-900">
      {/* 預覽區：滿版高度（控制面板以 bottom sheet 覆蓋） */}
      <div
        className={[
          "relative z-10 w-full bg-canvas-soft px-4 pb-4 pt-3",
          "shadow-sm",
          "min-h-screen"
        ].join(" ")}
      >
        <div className="mx-auto flex h-full max-w-md flex-col justify-between">
          {/* 標題與截圖模式開關 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-pink-400">
                Pin Accessory
              </p>
              <h1 className="text-xl font-semibold text-gray-900">
                Ch_1217 ✦ 別針飾品模擬器
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                實際效果與大小和成品會產生差異，僅供製作溝通，無法以此模擬圖要求成品。
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleScreenshotMode}
              className={[
                "w-[70px] shrink-0 whitespace-nowrap rounded-full border px-5 py-2 text-base font-medium transition",
                screenshotMode
                  ? "border-pink-400 bg-pink-50 text-pink-500"
                  : "border-gray-900 bg-gray-900 text-white"
              ].join(" ")}
            >
              完成
            </button>
          </div>

          {/* 別針與珠子預覽 */}
          <div className="mt-4 flex flex-1 items-center justify-center">
            <div className="relative flex h-[600px] w-full max-w-full overflow-hidden rounded-2xl bg-white shadow-md">
              {/* 左側 70% - 背景圖 + 鎖扣圖片（小螢幕置中，較大螢幕固定座標） */}
              <div
                className="relative w-[250px] h-[600px] flex-shrink-0 overflow-hidden bg-white flex items-center justify-center md:block"
              >
                {selectedTasselId && (() => {
                  const tassel = config.tassels?.find((t: Tassel) => t.id === selectedTasselId);
                  return tassel?.image ? (
                    <img
                      src={tassel.image}
                      alt={tassel.name}
                      className="absolute inset-0 object-contain"
                      style={{ left: '-31px', top: '118px', width: '300px', height: '450px', transform: 'rotate(12deg)' }}
                    />
                  ) : null;
                })()}
                <img
                  src="/images/bg.png"
                  alt="background"
                  className="absolute inset-0 object-contain"
                  style={{ left: '20px', top: '140px', width: '300px', height: '300px' }}
                />
                {selectedPendant?.image && (
                  <img
                    src={selectedPendant.image}
                    alt=""
                    className="absolute left-[46px] top-[176px] h-[120px] w-auto object-contain"
                    style={{ zIndex: 1, transform: 'rotate(20deg)' }}
                  />
                )}
                <img
                  src={selectedClasp.image}
                  alt={selectedClasp.name}
                  className="w-[120px] h-[120px] object-cover object-center absolute left-[90px] top-[29px]"
                />
                {(() => {
                  const BEAD_GAP = 2;
                  const baseTop = 184;
                  const getPreviewSize = (imgSrc: string) => {
                    if (imgSrc === "/images/beads/d-h-h.png") return 30;
                    if (
                      imgSrc === "/images/beads/d-h-b.png" ||
                      imgSrc === "/images/beads/d-h-w.png" ||
                      imgSrc === "/images/beads/d-o-1.png"
                    )
                      return 28;
                    return 23;
                  };
                  const sizes = [0, 1, 2, 3, 4, 5, 6].map((i) => {
                    const sel = selectedBeads[i] ?? null;
                    return getPreviewSize(getBeadImageUrl(sel));
                  });
                  const tops = sizes.map((_, i) =>
                    i === 0 ? baseTop : baseTop + sizes.slice(0, i).reduce((sum, h) => sum + h + BEAD_GAP, 0)
                  );
                  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
                    const sel = selectedBeads[i] ?? null;
                    const imgSrc = getBeadImageUrl(sel);
                    const size = getPreviewSize(imgSrc);
                    const isFlipBead =
                      sel?.groupId === "groupB" &&
                      ["heart_hollow_flip", "heart_black_flip", "heart_white_flip"].includes(sel?.id ?? "");
                    return (
                      <img
                        key={i}
                        src={imgSrc}
                        alt={`beads preview ${i + 1}`}
                        className="absolute object-cover object-center"
                        style={{
                          left: "158.5px",
                          top: `${tops[i]}px`,
                          width: size,
                          height: size,
                          transform: isFlipBead
                            ? "translateX(-50%) rotate(90deg) scaleX(-1)"
                            : "translateX(-50%) rotate(90deg)",
                        }}
                      />
                    );
                  });
                })()}
              </div>
              {/* 右側 - 鎖扣與控制區（填滿剩餘空間） */}
              <div className="flex h-full flex-1 min-w-0 flex-col bg-white/90 p-4 pl-0">
                {/* 鎖扣（點擊後展開下方控制面板） */}
                <div className="flex flex-col items-end gap-8">
                  {/* 群組 1：上方功能按鈕組 */}
                  <div className="flex w-full flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClaspPanelType("clasp");
                        setOpenPanel("clasp");
                      }}
                      className="flex w-full items-center justify-center gap-0 rounded-full border border-gray-200 bg-white/80 pl-2 pr-3.5 py-2 shadow-sm active:scale-95"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-semibold leading-none text-pink-500 font-sans">
                        ⟳
                      </div>
                      <span className="text-sm leading-none text-gray-600">換鎖扣</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClaspPanelType("pendant");
                        setOpenPanel("clasp");
                      }}
                      className="flex w-full items-center justify-center gap-0 rounded-full border border-gray-200 bg-white/80 pl-2 pr-3.5 py-2 shadow-sm active:scale-95"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-semibold leading-none text-amber-600 font-sans">
                        ✦
                      </div>
                      <span className="text-sm leading-none text-gray-600">加掛件</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClaspPanelType("tassel");
                        setOpenPanel("clasp");
                      }}
                      className="flex w-full items-center justify-center gap-0 rounded-full border border-gray-200 bg-white/80 pl-2 pr-3.5 py-2 shadow-sm active:scale-95"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-semibold leading-none text-sky-500 font-sans">
                        〰
                      </div>
                      <span className="text-sm leading-none text-gray-600">加流蘇</span>
                    </button>
                  </div>
                  {/* 群組 2：其餘 7 個按鈕一組（每顆不同顏色） */}
                  <div className="flex w-full flex-col items-end gap-2">
                    {(
                      [
                        "text-pink-500",
                        "text-violet-500",
                        "text-sky-500",
                        "text-emerald-500",
                        "text-amber-600",
                        "text-rose-500",
                        "text-fuchsia-500"
                      ] as const
                    ).map((colorClass, idx) => {
                      const hasBead = selectedBeads[idx] !== null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveBeadSlot(idx + 1);
                            setOpenPanel("bead");
                          }}
                          className="flex w-full items-center justify-center gap-0 rounded-full border border-gray-200 bg-white/80 pl-2 pr-3.5 py-2 shadow-sm active:scale-95"
                        >
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-lg font-semibold leading-none font-sans ${colorClass}`}>
                            {hasBead ? "⟳" : "+"}
                          </div>
                          <span className="text-sm leading-none text-gray-600">{idx + 1}號珠</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              {/* 截圖模式下顯示訂單代碼卡片 */}
              {screenshotMode && (
                <div className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">傳給賣家的格式</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-full bg-gray-900 px-2.5 py-1 text-sm font-medium text-white active:scale-95"
                    >
                      {copied ? "已複製" : "複製文字代碼"}
                    </button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-all">
                    {orderCode || "星星扣 | A-方黑# | A-圓透S | B-愛心黑 ..."}
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>

        </div>
      </div>

          {/* 控制面板：彈出視窗（點擊上方功能按鈕後，以底部彈出方式顯示） */}
      {!screenshotMode && openPanel && (
        <>
          {/* 鎖扣 / 掛件 / 流蘇 選擇面板 */}
          {openPanel === "clasp" && (
        <div className="fixed inset-x-0 bottom-0 top-[50px] z-20 rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.18)]">
          <div className="mx-auto flex h-full max-w-md flex-col">
            <div className="sticky top-0 z-10 bg-white pb-2">
              <div className="mt-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {claspPanelType === "clasp"
                    ? "鎖扣"
                    : claspPanelType === "pendant"
                    ? "掛件"
                    : "流蘇"}
                </h2>
                <div className="flex items-center gap-2">
                  {claspPanelType === "tassel" && selectedTasselId !== null && (
                    <button
                      type="button"
                      onClick={() => setSelectedTasselId(null)}
                      className="rounded-full px-3 py-1.5 text-sm font-medium transition border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95"
                    >
                      不需要流蘇
                    </button>
                  )}
                  {claspPanelType === "pendant" && selectedPendantId !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPendantId(null);
                        setOpenPanel(null);
                      }}
                      className="rounded-full px-3 py-1.5 text-sm font-medium transition border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95"
                    >
                      不加掛件
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenPanel(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95"
                    aria-label="關閉"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto pb-4">
              <div className="mt-1 grid grid-cols-3 gap-2">
                {claspPanelType === "tassel"
                  ? (config.tassels ?? []).filter((t: Tassel) => t.id !== "").map((tassel) => {
                      const active = (tassel.id || null) === selectedTasselId;
                      return (
                        <button
                          key={tassel.id || "none"}
                          type="button"
                          onClick={() => {
                            setSelectedTasselId(tassel.id || null);
                            setOpenPanel(null);
                          }}
                          className={[
                            "flex flex-col items-center justify-center rounded-xl border-2 px-2 py-0 text-sm transition min-h-[144px]",
                            active
                              ? "border-transparent shadow-sm [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#f9a8d4,#e879f9,#a384fc)_border-box] [background-clip:padding-box,border-box] [background-origin:padding-box,border-box]"
                              : "border-gray-200 bg-white text-gray-700 active:bg-gray-100"
                          ].join(" ")}
                        >
                          {tassel.image ? (
                            <img
                              src={tassel.image}
                              alt={tassel.name}
                              className="h-36 w-auto max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-base font-medium">{tassel.name}</span>
                          )}
                        </button>
                      );
                    })
                  : claspPanelType === "pendant"
                  ? (config.pendants ?? []).filter((p: Pendant) => p.id !== "").map((p: Pendant) => {
                      const active = (p.id || null) === selectedPendantId;
                      return (
                        <button
                          key={p.id || "none"}
                          type="button"
                          onClick={() => {
                            setSelectedPendantId(p.id || null);
                            setOpenPanel(null);
                          }}
                          className={[
                            "flex flex-col items-center justify-center rounded-xl border-2 px-2 py-2 text-sm transition min-h-[120px]",
                            active
                              ? "border-transparent shadow-sm [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#f9a8d4,#e879f9,#a384fc)_border-box] [background-clip:padding-box,border-box] [background-origin:padding-box,border-box]"
                              : "border-gray-200 bg-white text-gray-700 active:bg-gray-100"
                          ].join(" ")}
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt=""
                              className="h-24 w-auto max-w-full object-contain"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full border-2 border-dashed border-gray-300 bg-gray-50" aria-hidden />
                          )}
                        </button>
                      );
                    })
                  : config.clasps.map((clasp) => {
                      const active = clasp.id === selectedClaspId;
                      return (
                        <button
                          key={clasp.id}
                          type="button"
                          onClick={() => {
                            setSelectedClaspId(clasp.id);
                            setOpenPanel(null);
                          }}
                          className={[
                            "flex flex-col items-center justify-center rounded-xl border-2 px-2 py-2 text-sm transition",
                            active
                              ? "border-transparent shadow-sm [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#f9a8d4,#e879f9,#a384fc)_border-box] [background-clip:padding-box,border-box] [background-origin:padding-box,border-box]"
                              : "border-gray-200 bg-white text-gray-700 active:bg-gray-100"
                          ].join(" ")}
                        >
                          <span className="text-base font-medium">{clasp.name}</span>
                        </button>
                      );
                    })}
              </div>
            </div>
          </div>
        </div>
          )}
      {/* 加入珠子面板 */}
          {openPanel === "bead" && (
        <div className="fixed inset-x-0 bottom-0 top-[50px] z-20 rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.18)]">
          <div className="mx-auto flex h-full max-w-md flex-col">
            <div className="sticky top-0 z-10 bg-white pb-2">
              <div className="mt-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  第{activeBeadSlot ?? 1}顆珠子
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const slot = (activeBeadSlot ?? 1) - 1;
                      handleRemoveBead(slot);
                      setOpenPanel(null);
                      setActiveBeadSlot(null);
                    }}
                    className="rounded-full px-2.5 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 active:scale-95"
                  >
                    清空
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPanel(null);
                      setActiveBeadSlot(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95"
                    aria-label="關閉"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
              {/* 珠子分類 Tabs：方形 / 圓形 / 數字 / 裝飾 */}
              <div className="mt-2 flex rounded-full bg-gray-100 p-1 text-sm">
                {[
                  { id: "squareLetter" as BeadTabId, label: "方形" },
                  { id: "roundLetter" as BeadTabId, label: "圓形" },
                  { id: "number" as BeadTabId, label: "數字" },
                  { id: "decor" as BeadTabId, label: "裝飾" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                    setBeadActiveTab(tab.id);
                    setBeadSubFilter(getDefaultSubFilter(tab.id));
                  }}
                    className={[
                      "flex-1 rounded-full px-2 py-1.5 font-medium transition",
                      beadActiveTab === tab.id
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-500"
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* 第二層選單：依第一層顯示不同選項 */}
              {(() => {
                const subOpts = getSecondLayerOptions(beadActiveTab);
                return subOpts ? (
                <div className="mt-2 flex rounded-full bg-gray-100 p-1 text-sm">
                  {subOpts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBeadSubFilter(item.id)}
                      className={[
                        "flex-1 rounded-full px-2 py-1.5 font-medium transition",
                        beadSubFilter === item.id
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-500"
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                ) : null;
              })()}
              {((beadActiveTab === "squareLetter" || beadActiveTab === "roundLetter") && beadSubFilter === "silver") && (
                <p className="mt-2 text-sm text-amber-600">
                  較易產生磨痕或電鍍痕跡
                </p>
              )}
            </div>
            <div className="mt-3 flex-1 space-y-4 overflow-y-auto pb-4">
              {isLetterBeadTab(beadActiveTab, beadSubFilter) ? (
                <div className="grid grid-cols-4 gap-2">
                  {/* 方形字母-黑色：額外符號 #、❤︎ */}
                    {beadActiveTab === "squareLetter" &&
                    beadSubFilter === "black" &&
                    ["#", "❤︎"].map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() =>
                          handleSetBead((activeBeadSlot ?? 1) - 1, "groupA", "square_symbol_black", sym)
                        }
                        className={[
                          "rounded-xl border px-3 py-3 text-base text-center font-semibold leading-tight transition",
                          "bg-white shadow-sm border-gray-200 active:scale-95 active:bg-gray-100 flex items-center justify-center"
                        ].join(" ")}
                      >
                        <img
                          src={getLetterButtonImageSrc(beadActiveTab, beadSubFilter, sym)}
                          alt={sym}
                          className="h-8 w-8 object-contain"
                        />
                      </button>
                    ))}
                  {LETTERS.map((letter) => {
                    const info = getLetterBeadForTabColor(beadActiveTab, beadSubFilter)!;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() =>
                          handleSetBead((activeBeadSlot ?? 1) - 1, info.groupId, info.beadId, letter)
                        }
                        className={[
                          "rounded-xl border px-3 py-3 text-base text-center font-semibold leading-tight transition",
                          "bg-white shadow-sm border-gray-200 active:scale-95 active:bg-gray-100 flex items-center justify-center"
                        ].join(" ")}
                      >
                        <img
                          src={getLetterButtonImageSrc(beadActiveTab, beadSubFilter, letter)}
                          alt={letter}
                          className="h-8 w-8 object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                renderBeadList(
                (() => {
                  const base = filterBeadsBySub(
                    getBeadsByTab(beadActiveTab),
                    beadActiveTab,
                    beadSubFilter
                  );
                  if (beadActiveTab === "number") {
                    const ga = getGroupById("groupA");
                    const symBead = getBeadByIds("groupA", "square_symbol_black");
                    if (ga && symBead) {
                      return [
                        ...base,
                        { group: ga, bead: symBead, letter: "#", label: "#" }
                      ];
                    }
                  }
                  return base;
                })()
              )
              )}
            </div>
          </div>
        </div>
          )}
          {/* 黑色透明遮罩，點擊可關閉 */}
          <div
            className="fixed inset-0 z-[19] bg-black/40"
            onClick={() => {
              setOpenPanel(null);
              setActiveBeadSlot(null);
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* 桌面版：左右版面（簡易） */}
      <div className="hidden min-h-screen bg-gray-50 p-6 lg:flex lg:items-stretch lg:justify-center">
        <div className="flex w-full max-w-5xl gap-6 rounded-3xl bg-white p-4 shadow-lg">
          <div className="flex-1 border-r border-gray-100 pr-4">
            {/* 可以未來擴充為更大預覽區 */}
          </div>
          <div className="flex-[1.1] pl-4">
            {/* 未來可重用手機控制面板邏輯 */}
          </div>
        </div>
      </div>
    </div>
  );
}

