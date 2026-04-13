import { useMemo, useState } from "react";
import config from "../config.json";

type Config = typeof config;
type Clasp = Config["clasps"][number];
type Tassel = Config["tassels"][number];
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
      case "other_2":
        return "/images/beads/d-o-2.png";
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

export default function App() {
  const [beadActiveTab, setBeadActiveTab] = useState<BeadTabId>("squareLetter");
  const [beadSubFilter, setBeadSubFilter] = useState<string>("silver");
  const [activeBeadSlot, setActiveBeadSlot] = useState<number | null>(null);
  const [selectedClaspId, setSelectedClaspId] = useState<string>(
    config.clasps.find((c) => c.id === "star")?.id ?? config.clasps[0]?.id ?? ""
  );
  const [selectedBeads, setSelectedBeads] = useState<(SelectedBead | null)[]>(
    () => Array(7).fill(null)
  );
  const [openPanel, setOpenPanel] = useState<"clasp" | "bead" | null>(null);
  const [claspPanelType, setClaspPanelType] = useState<"clasp" | "tassel">("clasp");
  // 預設選擇流蘇 t-4（若不存在則退回第一款）
  const [selectedTasselId, setSelectedTasselId] = useState<string>(() => {
    const preferred = config.tassels?.find((t: Tassel) => t.id === "t-4")?.id;
    const fallback = config.tassels?.find((t: Tassel) => t.id)?.id;
    return preferred ?? fallback ?? "";
  });

  const selectedClasp = useMemo(
    () =>
      config.clasps.find((c) => c.id === selectedClaspId) ??
      config.clasps.find((c) => c.id === "star") ??
      config.clasps[0],
    [selectedClaspId]
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

  const activeSlotIndex = (activeBeadSlot ?? 1) - 1;
  const activeSlotSelection = selectedBeads[activeSlotIndex] ?? null;

  const isActiveSelection = (groupId: string, beadId: string, letter?: string) => {
    if (!activeSlotSelection) return false;
    if (activeSlotSelection.groupId !== groupId) return false;
    if (activeSlotSelection.id !== beadId) return false;
    return (activeSlotSelection.letter ?? "") === (letter ?? "");
  };


  const renderBeadList = (
    items: { group: BeadGroup; bead: Bead; letter?: string; label?: string }[]
  ) => (
    <div className="mt-3">
      <div
        className={[
          "grid gap-2 p-1",
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
                "rounded-2xl px-3 py-3 text-base text-center font-semibold leading-tight transition-all duration-200",
                "soft-card soft-card-btn active:scale-95 flex items-center justify-center",
                isActiveSelection(group.id, bead.id, letter) ? "soft-img-btn-active" : ""
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
    <div className="soft-surface flex min-h-screen flex-col text-gray-900">
      {/* 預覽區：滿版高度（控制面板以 bottom sheet 覆蓋） */}
      <div
        className={[
          "relative z-10 w-full bg-[#FFF8FA] px-4 pb-4 pt-3",
          "min-h-screen"
        ].join(" ")}
      >
        <div className="mx-auto flex h-full max-w-md flex-col justify-between">
          {/* 標題區 */}
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

          {/* 別針與珠子預覽 */}
          <div className="mt-4 flex flex-1 items-center justify-center bg-[#FFF8FA]">
            <div className="soft-card no-hover-lift relative flex h-[550px] w-full max-w-full overflow-hidden rounded-[28px]">
              {/* 左側 70% - 背景圖 + 鎖扣圖片（小螢幕置中，較大螢幕固定座標） */}
              <div
                className="relative flex h-[550px] w-[250px] flex-shrink-0 items-center justify-center overflow-hidden bg-white/80 md:block"
              >
                {selectedTasselId !== "" && (() => {
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
                    const isNoRotateBead = sel?.groupId === "groupB" && sel?.id === "other_2";
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
                          transform: isNoRotateBead
                            ? "translateX(-50%)"
                            : isFlipBead
                              ? "translateX(-50%) rotate(90deg) scaleX(-1)"
                              : "translateX(-50%) rotate(90deg)",
                        }}
                      />
                    );
                  });
                })()}
              </div>
              {/* 右側 - 鎖扣與控制區（填滿剩餘空間） */}
              <div className="flex h-full min-w-0 flex-1 flex-col bg-white p-4 pl-0">
                {/* 鎖扣（點擊後展開下方控制面板） */}
                <div className="flex h-full w-full flex-col items-end justify-between py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setClaspPanelType("clasp");
                      setOpenPanel("clasp");
                    }}
                    className="soft-pill soft-pill-rainbow-border flex w-full items-center justify-center gap-0 pl-2 pr-3.5 py-2 active:scale-95"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-semibold leading-none text-pink-500 font-sans">
                      ⟳
                    </div>
                    <span className="text-sm leading-none text-gray-600">換鎖扣</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClaspPanelType("tassel");
                      setOpenPanel("clasp");
                    }}
                    className="soft-pill soft-pill-rainbow-border flex w-full items-center justify-center gap-0 pl-2 pr-3.5 py-2 active:scale-95"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-semibold leading-none text-sky-500 font-sans">
                      〰
                    </div>
                    <span className="text-sm leading-none text-gray-600">換配件</span>
                  </button>
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
                        className="soft-pill flex w-full items-center justify-center gap-0 pl-2 pr-3.5 py-2 active:scale-95"
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
            </div>
          </div>
          <p className="mt-2 text-center text-sm font-medium text-gray-600">
            ❤️💜設計完成後截圖保存，用聊聊貼給我看喔🩵💙
          </p>

        </div>
      </div>

          {/* 控制面板：彈出視窗（點擊上方功能按鈕後，以底部彈出方式顯示） */}
      {openPanel && (
        <>
          {/* 鎖扣 / 掛飾 / 流蘇 選擇面板 */}
          {openPanel === "clasp" && (
        <div className="soft-sheet fixed inset-x-0 bottom-0 top-[50px] z-20 rounded-t-3xl px-4 pb-6 pt-3">
          <div className="mx-auto flex h-full max-w-md flex-col">
            <div className="sticky top-0 z-10 pb-2">
              <div className="mt-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {claspPanelType === "clasp" ? "鎖扣" : "流蘇"}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenPanel(null)}
                    className="soft-icon-btn flex h-8 w-8 items-center justify-center text-gray-500 active:scale-95"
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
              <div className="mt-1 grid grid-cols-3 gap-2 p-1">
                {claspPanelType === "tassel"
                  ? (config.tassels ?? []).filter((t: Tassel) => t.id !== "").map((tassel) => {
                      const active = (tassel.id || null) === selectedTasselId;
                      return (
                        <button
                          key={tassel.id || "none"}
                          type="button"
                          onClick={() => {
                            setSelectedTasselId(tassel.id || "");
                            setOpenPanel(null);
                          }}
                          className={[
                            "flex flex-col items-center justify-center rounded-xl px-2 py-0 text-sm transition min-h-[144px]",
                            active
                              ? "soft-card soft-img-btn-active text-gray-900"
                              : "soft-card soft-card-btn text-gray-700 active:scale-95"
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
                            "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-sm transition",
                            active
                              ? "soft-card soft-card-btn soft-btn-active text-gray-900"
                              : "soft-card text-gray-700 active:scale-95"
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
        <div className="soft-sheet fixed inset-x-0 bottom-0 top-[50px] z-20 rounded-t-3xl px-4 pb-6 pt-3">
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
                    className="soft-btn rounded-full px-2.5 py-1 text-sm font-medium text-gray-600 active:scale-95"
                  >
                    清空
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPanel(null);
                      setActiveBeadSlot(null);
                    }}
                    className="soft-icon-btn flex h-8 w-8 items-center justify-center text-gray-500 active:scale-95"
                    aria-label="關閉"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
              {/* 珠子分類 Tabs：方形 / 圓形 / 數字 / 裝飾 */}
              <div className="soft-inset mt-2 flex p-1 text-sm">
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
                        ? "soft-btn-active text-gray-900"
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
                <div className="soft-inset mt-2 flex p-1 text-sm">
                  {subOpts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBeadSubFilter(item.id)}
                      className={[
                        "flex-1 rounded-full px-2 py-1.5 font-medium transition",
                        beadSubFilter === item.id
                          ? "soft-btn-active text-gray-900"
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
                <p className="mt-2 text-sm text-gray-400">
                  較易產生磨痕或電鍍痕跡
                </p>
              )}
            </div>
            <div className="mt-3 flex-1 space-y-4 overflow-y-auto px-1 pb-4">
              {isLetterBeadTab(beadActiveTab, beadSubFilter) ? (
                <div className="grid grid-cols-4 gap-2 p-1">
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
                          "rounded-2xl px-3 py-3 text-base text-center font-semibold leading-tight transition-all duration-200",
                          "soft-card active:scale-95 flex items-center justify-center",
                          isActiveSelection("groupA", "square_symbol_black", sym) ? "soft-img-btn-active" : ""
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
                          "rounded-xl px-3 py-3 text-base text-center font-semibold leading-tight transition",
                          "soft-card active:scale-95 flex items-center justify-center",
                          isActiveSelection(info.groupId, info.beadId, letter) ? "soft-img-btn-active" : ""
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

    </div>
  );
}

