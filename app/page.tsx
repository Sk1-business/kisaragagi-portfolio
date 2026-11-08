import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  ArrowUpRight, 
  Layers, 
  Cpu, 
  Palette, 
  Compass, 
  Mail, 
  Globe2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Database, 
  Workflow, 
  Radio, 
  Sparkles, 
  ExternalLink,
  Layers3,
  Network,
  Share2,
  Sliders,
  Crosshair,
  Code2,
  Atom,
  Eye,
  X,
  Play,
  TrendingUp,
  MapPin,
  Headphones,
  RefreshCw,
  GitCompare,
  Zap,
  Target
} from "lucide-react";

export default function App() {
  const [lang, setLang] = useState("JA");
  const toggleLang = () => setLang((prev) => (prev === "EN" ? "JA" : "EN"));

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [artModalUrl, setArtModalUrl] = useState(null);
  
  // CPS Slide Interactive State
  const [cpsPhase, setCpsPhase] = useState("phase1");
  
  // Strategy Workflow Interactive State (As-Is / GAP / To-Be)
  const [strategyStage, setStrategyStage] = useState("gap"); // "asis" | "marketin" | "gap" | "tobe"

  // Ontology Graph Active Node State
  const [activeOntoNode, setActiveOntoNode] = useState("tacit");

  // Mouse Coordinate tracker for Ochiai-style digital nature spatial UI
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Web Audio Context for tactile micro-acoustics
  const audioCtxRef = useRef(null);
  const playChirp = (freq = 440, type = "sine") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch (e) {}
  };

  // Kinetic Particle Canvas (Yoichi Ochiai: Digital Nature particle waves)
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const count = 80;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.6 + 0.2
    }));

    let t = 0;
    const render = () => {
      t += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric space gradient
      const grad = ctx.createRadialGradient(
        width * 0.5, height * 0.15, 60,
        width * 0.5, height * 0.6, width * 0.9
      );
      grad.addColorStop(0, "rgba(30, 45, 80, 0.22)");
      grad.addColorStop(0.45, "rgba(10, 14, 25, 0.12)");
      grad.addColorStop(1, "rgba(3, 3, 5, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Interactive particle mesh
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 125) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${(1 - dist / 125) * 0.14})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Ontology Nodes for Heavy Manufacturing Knowledge Graph
  const ontologyNodes = [
    {
      id: "tacit",
      name: "Artisan Tacit Mastery",
      nameJa: "熟練工の身体知・暗黙知",
      type: "SOMATIC SENSE",
      detailJa: "切削音の周波数や微振動の触知覚など、数十年蓄積された言語化不能な身体勘を音響・圧力プロファイルへ定式化。",
      detailEn: "Codifying 40+ years of unwritten auditory and tactile mastery into quantified micro-frequency parameters.",
      color: "#F59E0B",
      pos: { x: 20, y: 35 }
    },
    {
      id: "edge",
      name: "Edge High-Freq Sensors",
      nameJa: "エッジ高頻度テレメトリ",
      type: "CPS TELEMETRY",
      detailJa: "ミリ秒精度の振動・熱流体・電力波形をリアルタイム抽出し、エッジ側で特異点スコアリングを実施。",
      detailEn: "Sub-second physical vibration, thermal gradients, and electrical harmonics captured at line rate.",
      color: "#3B82F6",
      pos: { x: 20, y: 72 }
    },
    {
      id: "semantic",
      name: "Semantic Knowledge Fabric",
      nameJa: "オントロジー知識ファブリック",
      type: "OWL / SHACL SCHEMA",
      detailJa: "分断されたERP/MESと物理制約を統合。物理因果律をセマンティックに紐付け、自動推論を可能にする中核。",
      detailEn: "Cross-system graph reconciling enterprise tables with physical mechanics and operational constraints.",
      color: "#8B5CF6",
      pos: { x: 55, y: 52 },
      primary: true
    },
    {
      id: "agent",
      name: "Autonomous Action Reasoner",
      nameJa: "自律ディスパッチ推論器",
      type: "REASONING AGENT",
      detailJa: "オントロジー上で因果推論を行い、突発故障や品質低下を回避する自動パラメータ補正をラインへフィードバック。",
      detailEn: "Autonomous reasoning engine dispatching closed-loop parameter corrections to production lines.",
      color: "#10B981",
      pos: { x: 85, y: 40 }
    },
    {
      id: "corp",
      name: "Assetized CoE Standard",
      nameJa: "全社知的資産・標準化",
      type: "ENTERPRISE ASSET",
      detailJa: "個社・個別ラインに閉じず、東京本社コングロマリット全社で再利用可能なオントロジー設計標準として確立。",
      detailEn: "Standardized methodology institutionalized across global business units as reusable corporate capital.",
      color: "#EC4899",
      pos: { x: 85, y: 75 }
    }
  ];

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#030305] text-[#ECECF0] antialiased selection:bg-blue-600/30 selection:text-white font-sans overflow-x-hidden relative"
    >
      {/* Background Interactive Kinetic Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Ochiai Spatial Coordinate HUD in Corner */}
      <div className="fixed bottom-4 left-6 z-50 pointer-events-none hidden md:flex items-center gap-3 text-[10px] font-mono text-neutral-500 tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <Crosshair size={11} className="text-blue-400 animate-spin" style={{ animationDuration: "12s" }} />
        <span>POS [ {String(mousePos.x).padStart(4, "0")} : {String(mousePos.y).padStart(4, "0")} ]</span>
        <span className="text-neutral-700">|</span>
        <span className="text-blue-400">DIGITAL NATURE MESH</span>
      </div>

      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#030305]/75 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a 
            href="#" 
            onClick={() => playChirp(600)}
            className="flex items-center gap-3 font-mono text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_#3b82f6] animate-pulse" />
            <span className="text-white font-semibold text-sm tracking-normal">kisaragi</span>
            <span className="text-[10px] text-neutral-500 px-2 py-0.5 rounded border border-white/10 hidden sm:inline">
              STUDIO & ARTIFACTS
            </span>
          </a>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-7 text-[11px] font-mono tracking-widest text-neutral-400">
              <a href="#strategy" className="hover:text-white transition-colors">01 // STRATEGY & GAP</a>
              <a href="#artifacts" className="hover:text-white transition-colors">02 // ARTIFACTS</a>
              <a href="#saas" className="hover:text-white transition-colors">03 // ST. STUDIO</a>
              <a href="#media-art" className="hover:text-white transition-colors">04 // BIO-MEDIA</a>
              <a href="#dialogue" className="hover:text-white transition-colors">05 // DIALOGUE</a>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playChirp(700);
                }}
                className={`p-2 rounded-full border transition-all ${
                  soundEnabled
                    ? "border-blue-500/60 bg-blue-500/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "border-white/10 bg-white/[0.02] text-neutral-500 hover:text-neutral-300"
                }`}
                title={soundEnabled ? "Mute Acoustic Synthesis" : "Enable Acoustic Synthesis"}
                aria-label="Sound Toggle"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>

              <button
                onClick={() => {
                  toggleLang();
                  playChirp(540);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all text-neutral-300"
              >
                <Globe2 size={12} className="text-blue-400" />
                <span>{lang}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-28 pb-20 md:pt-40 md:pb-28 max-w-7xl mx-auto px-6">
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono tracking-widest uppercase backdrop-blur-md">
            <Atom size={12} className="animate-spin text-cyan-400" style={{ animationDuration: "10s" }} />
            <span>MEANING OVER UTILITY // 意味がある &gt; 役に立つ</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight text-white leading-[1.02]">
            Tactile Objects. <br />
            <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-neutral-400">
              Autonomous Systems.
            </span>
          </h1>

          <div className="text-sm sm:text-base text-neutral-400 font-light max-w-xl font-mono leading-relaxed pt-2">
            {lang === "JA" ? (
              <p>
                数理や記号論理だけでは現場の身体的摩擦を超えられない。<br />
                SaaSスタジオ、メディアアート、産業CPSオントロジーをひとつの生命体として同期させる。
              </p>
            ) : (
              <p>
                Pure computational logic fails in the friction of physical frontlines.<br />
                Synchronizing SaaS venture, media art, and enterprise CPS into a unified organism.
              </p>
            )}
          </div>

          <div className="pt-4 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
            <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> St. Studio (10 Core / 3 Products)
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Bio-Media Art
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Enterprise CPS & Ontology (Tokyo-HQ Conglomerate)
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Systems Theory (Ph.D.)
            </span>
          </div>
        </div>
      </section>

      {/* NEW SECTION: STRATEGIC ENTERPRISE CONSULTING (As-Is / GAP Analysis / Market-In / To-Be) */}
      <section id="strategy" className="relative z-10 py-20 border-t border-white/[0.06] bg-gradient-to-b from-[#05060b] to-[#030305]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 tracking-widest uppercase mb-2">
                <Target size={13} className="text-blue-400" />
                <span>ENTERPRISE STRATEGY & TRANSFORMATION ARCHITECTURE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-white">
                構想策定・As-Is / To-Be 業務改革アーキテクチャ
              </h2>
            </div>

            {/* Stepper / Mode Selector */}
            <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs">
              {[
                { id: "asis", label: "01. AS-IS (現場摩擦)" },
                { id: "marketin", label: "02. MARKET-IN (価値再定義)" },
                { id: "gap", label: "03. GAP & ROADMAP" },
                { id: "tobe", label: "04. TO-BE (CPS/AI)" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStrategyStage(tab.id);
                    playChirp(520);
                  }}
                  className={`px-3 py-2 rounded-xl transition-all ${
                    strategyStage === tab.id
                      ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Strategic Canvas */}
          <div className="rounded-3xl border border-white/10 bg-[#070810] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Stage Diagram (Dynamic SVG Architecture) */}
              <div className="lg:col-span-7 h-80 sm:h-96 rounded-2xl bg-black/70 border border-white/[0.08] p-6 relative flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                  <span className="flex items-center gap-2 text-blue-400">
                    <Zap size={13} className="animate-pulse" />
                    <span>WORKFLOW MATRIX // {strategyStage.toUpperCase()}</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">EXECUTIVE METHODOLOGY</span>
                </div>

                {/* SVG Visual Stage Morphing */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {strategyStage === "asis" && (
                    <div className="w-full space-y-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-3 gap-3 text-center font-mono">
                        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                          <div className="font-bold mb-1">分断基幹Silo</div>
                          <div className="text-[9px] text-neutral-400">ERP / MES / 手書き帳票の断絶</div>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
                          <div className="font-bold mb-1">属人的身体知</div>
                          <div className="text-[9px] text-neutral-400">熟練工退職による技術喪失</div>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs">
                          <div className="font-bold mb-1">プロダクトアウト</div>
                          <div className="text-[9px] text-neutral-500">現場の稼働優先で市場乖離</div>
                        </div>
                      </div>
                      <div className="text-center text-[10px] font-mono text-red-400">
                        ⚠ 業務リードタイム遅延 & 現場と経営の機能的分化摩擦
                      </div>
                    </div>
                  )}

                  {strategyStage === "marketin" && (
                    <div className="w-full space-y-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-3 gap-3 text-center font-mono">
                        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-400 text-cyan-200 text-xs">
                          <div className="font-bold mb-1">需要起点 (Demand)</div>
                          <div className="text-[9px] text-neutral-300">エンドユーザーの真の身体摩擦</div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-400 text-blue-200 text-xs">
                          <div className="font-bold mb-1">エコシステム設計</div>
                          <div className="text-[9px] text-neutral-300">自社単独から業界標準CoEへ</div>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-400 text-indigo-200 text-xs">
                          <div className="font-bold mb-1">成果連動型モデル</div>
                          <div className="text-[9px] text-neutral-300">モノ売りからCPSサービス化</div>
                        </div>
                      </div>
                      <div className="text-center text-[10px] font-mono text-cyan-300">
                        ✓ 顧客の身体体験と市場動態に同期する「マーケットイン」構想
                      </div>
                    </div>
                  )}

                  {strategyStage === "gap" && (
                    <div className="w-full space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-xs font-mono px-4">
                        <span className="text-red-400">As-Is (現状)</span>
                        <span className="text-blue-400 font-bold">GAP解消ロードマップ</span>
                        <span className="text-emerald-400">To-Be (理想形)</span>
                      </div>
                      <div className="relative w-full h-12 bg-neutral-900 rounded-full border border-white/10 flex items-center px-4 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-red-500/20 via-blue-500/40 to-emerald-500/30" />
                        <div className="relative z-10 w-full flex justify-between text-[10px] font-mono text-white">
                          <span>Phase 1: 暗黙知の記号化</span>
                          <span>Phase 2: オントロジー標準化</span>
                          <span>Phase 3: 自律Agent実装</span>
                        </div>
                      </div>
                      <div className="text-center text-[10px] font-mono text-blue-300">
                        ⚡ 投資対効果（ROI）と現場受容性を両立する段階的トランスフォーメーション
                      </div>
                    </div>
                  )}

                  {strategyStage === "tobe" && (
                    <div className="w-full space-y-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-3 gap-3 text-center font-mono">
                        <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-400 text-purple-200 text-xs">
                          <div className="font-bold mb-1">全社オントロジー</div>
                          <div className="text-[9px] text-neutral-300">Semantic Data Fabric</div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-400 text-blue-200 text-xs">
                          <div className="font-bold mb-1">CPS閉ループ制御</div>
                          <div className="text-[9px] text-neutral-300">リアルタイム適応ディスパッチ</div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-400 text-emerald-200 text-xs">
                          <div className="font-bold mb-1">自律エージェント</div>
                          <div className="text-[9px] text-neutral-300">現場と経営の自動整合</div>
                        </div>
                      </div>
                      <div className="text-center text-[10px] font-mono text-emerald-400">
                        ★ 手法の資産化完了 // グローバル展開可能な標準フレームワーク
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 border-t border-white/[0.05] pt-2">
                  <span>ENTERPRISE TRANSFORMATION SUITE</span>
                  <span>CONFIDENTIAL BLUEPRINT</span>
                </div>
              </div>

              {/* Right Column: Strategic Consulting Capabilities */}
              <div className="lg:col-span-5 space-y-5">
                <div className="text-xs font-mono text-blue-400 tracking-wider">
                  CONSULTING IMPACT & METHODOLOGY
                </div>
                <h3 className="text-2xl font-normal text-white">
                  {strategyStage === "asis" && "現状業務・現場摩擦の深層エスノグラフィ"}
                  {strategyStage === "marketin" && "マーケットインによる事業・プロダクト構想策定"}
                  {strategyStage === "gap" && "As-Is / To-Be ギャップ分析と実行ロードマップ"}
                  {strategyStage === "tobe" && "CPS・オントロジー全社資産化と自律運用"}
                </h3>
                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  {strategyStage === "asis" && "現場の泥臭い身体的慣行、部門間の用語のズレ、未統合な基幹データが引き起こす隠れた業務摩擦（機能分化の断絶）を解読し、問題の本質をあぶり出します。"}
                  {strategyStage === "marketin" && "単なる社内論理や技術先行のプロダクトアウトを脱却。顧客の生体動線や現場の受容性を起点にした市場直結型のアーキテクチャを構想します。"}
                  {strategyStage === "gap" && "理想（To-Be）と現実（As-Is）の乖離を因果関係として構造化。組織の反発を最小化しつつROIを最大化するフェーズ別移行シナリオを策定します。"}
                  {strategyStage === "tobe" && "個社・特定工場への個別導入で終わらせず、コングロマリット全体で横展開可能な『オントロジー設計標準・知的資産』として組織に定着させます。"}
                </p>

                {/* Quantitative Impact Indicators */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.08]">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] font-mono text-neutral-500">FRICTION</div>
                    <div className="text-sm font-mono text-emerald-400 font-medium">-70% 削減</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] font-mono text-neutral-500">SPEED</div>
                    <div className="text-sm font-mono text-blue-400 font-medium">10x デプロイ</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] font-mono text-neutral-500">ASSET</div>
                    <div className="text-sm font-mono text-purple-400 font-medium">全社標準化</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ARTIFACTS & CONSULTING BLUEPRINTS */}
      <section id="artifacts" className="relative z-10 py-20 border-t border-white/[0.06] bg-[#050508]/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-2">
                02 // INTERACTIVE ARTIFACTS & CONSULTING CAPABILITIES
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-white">
                Living Architecture & Blueprints
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-500 max-w-sm">
              {lang === "JA" 
                ? "文字で説明するのではなく、動くオブジェクトとして体感する。提案中のCPS構想とオントロジー推論基盤。"
                : "Experience architectures directly through responsive artifacts rather than static text."}
            </p>
          </div>

          {/* ARTIFACT 1: HEAVY MANUFACTURING KNOWLEDGE GRAPH */}
          <div className="rounded-3xl border border-white/10 bg-[#080910] p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-wrap items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-400 uppercase tracking-widest">
                    ENTERPRISE / CONFIDENTIAL
                  </span>
                  <span className="text-xs font-mono text-neutral-500">
                    Tokyo-HQ Heavy Infrastructure Enterprise
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-normal text-white">
                  Heavy Manufacturing Knowledge Graph
                </h3>
                <p className="text-xs font-mono text-neutral-400">
                  Ontological Architecture & Artisan Tacit Knowledge Integration
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                <Activity size={13} className="text-purple-400 animate-pulse" />
                <span>INTERACTIVE ONTOLOGY ENGINE ACTIVE</span>
              </div>
            </div>

            {/* Living Interactive Ontology Visualizer Canvas / SVG */}
            <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 h-80 sm:h-96 w-full rounded-2xl bg-black/60 border border-white/[0.07] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_70%)]" />

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {ontologyNodes.map((n, i) => {
                    const center = ontologyNodes.find(item => item.primary);
                    if (n.id === center.id) return null;
                    const isActive = activeOntoNode === n.id || activeOntoNode === center.id;
                    return (
                      <line
                        key={i}
                        x1={`${n.pos.x}%`}
                        y1={`${n.pos.y}%`}
                        x2={`${center.pos.x}%`}
                        y2={`${center.pos.y}%`}
                        stroke={isActive ? n.color : "#4b5563"}
                        strokeWidth={isActive ? "2" : "1"}
                        strokeDasharray={isActive ? "none" : "3 3"}
                        opacity={isActive ? 0.8 : 0.25}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </svg>

                {ontologyNodes.map((node) => {
                  const isSelected = activeOntoNode === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        setActiveOntoNode(node.id);
                        playChirp(node.primary ? 640 : 520);
                      }}
                      style={{ left: `${node.pos.x}%`, top: `${node.pos.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-950/80 border-purple-400 scale-110 shadow-[0_0_30px_rgba(168,85,247,0.4)] z-20"
                          : "bg-white/[0.04] border-white/10 hover:border-white/30 z-10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className={`w-2.5 h-2.5 rounded-full ${isSelected ? "animate-ping" : ""}`} 
                          style={{ backgroundColor: node.color }} 
                        />
                        <span className="text-xs font-mono font-medium text-white whitespace-nowrap">
                          {node.name}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-neutral-400 mt-1">
                        {node.type}
                      </div>
                    </div>
                  );
                })}

                <div className="absolute bottom-3 left-4 text-[9px] font-mono text-neutral-500">
                  TAP NODES TO INSPECT RELATIONS
                </div>
              </div>

              {/* Node Inspector Card */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-white/[0.03] border border-white/10 h-80 sm:h-96 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 mb-3">
                    <span>SEMANTIC INSPECTION</span>
                    <span>ACTIVE</span>
                  </div>

                  {(() => {
                    const current = ontologyNodes.find(n => n.id === activeOntoNode) || ontologyNodes[0];
                    return (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: current.color }} />
                          <h4 className="text-base font-medium text-white">
                            {lang === "JA" ? current.nameJa : current.name}
                          </h4>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 inline-block">
                          {current.type}
                        </div>
                        <p className="text-xs text-neutral-300 font-light leading-relaxed">
                          {lang === "JA" ? current.detailJa : current.detailEn}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[10px] font-mono text-neutral-500 flex justify-between">
                  <span>METHODOLOGY: ASSETIZED</span>
                  <span>NDA COMPLIANT</span>
                </div>
              </div>
            </div>
          </div>

          {/* ARTIFACT 2: AUTONOMOUS MINING CPS BLUEPRINT */}
          <div className="rounded-3xl border border-white/10 bg-[#080910] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400 uppercase tracking-widest">
                    CPS CONSULTING SPECIFICATION // PROPOSAL ACTIVE
                  </span>
                  <span className="text-xs font-mono text-neutral-500">
                    Latin America Mega-Mining Basin (4,000m+)
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-normal text-white">
                  Autonomous Mining CPS Blueprint
                </h3>
                <p className="text-xs font-mono text-neutral-400">
                  High-Altitude Fleet Dispatch & Somatic Labor Equilibrium Architecture
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
                {[
                  { id: "phase1", label: "01. TELEMETRY" },
                  { id: "phase2", label: "02. SOMATIC ECO" },
                  { id: "phase3", label: "03. DISPATCH" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCpsPhase(tab.id);
                      playChirp(490);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      cpsPhase === tab.id
                        ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 h-72 sm:h-80 rounded-2xl bg-black/60 border border-white/[0.08] p-6 relative flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Activity size={12} className="animate-pulse" />
                    <span>CPS LAYER: {cpsPhase.toUpperCase()}</span>
                  </span>
                  <span className="text-[10px] text-neutral-600">CONSULTING BLUEPRINT</span>
                </div>

                <div className="relative w-full h-full flex items-center justify-center">
                  {cpsPhase === "phase1" && (
                    <div className="space-y-4 text-center font-mono animate-in fade-in duration-300">
                      <div className="flex justify-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-400 text-xs text-blue-200">
                          Altitude 4,200m Physics<br />(Low Oxygen / Brake Heat)
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-neutral-300">
                          Autonomous Dump Fleet<br />(CAN-Bus / LiDAR Realtime)
                        </div>
                      </div>
                      <div className="text-[10px] text-cyan-400">
                        ⇄ Sub-10ms Mesh Transmission Fabric ⇄
                      </div>
                    </div>
                  )}

                  {cpsPhase === "phase2" && (
                    <div className="space-y-4 text-center font-mono animate-in fade-in duration-300">
                      <div className="flex justify-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-400 text-xs text-amber-200">
                          Local Operator Fatigue Index<br />(Biometric Telemetry)
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-400 text-xs text-emerald-200">
                          Labor Union Structural Coupling<br />(Social Equilibrium Model)
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-300">
                        ⚡ Mitigating Societal Rejection of Automation ⚡
                      </div>
                    </div>
                  )}

                  {cpsPhase === "phase3" && (
                    <div className="space-y-4 text-center font-mono animate-in fade-in duration-300">
                      <div className="flex justify-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-400 text-xs text-purple-200">
                          Closed-Loop Cybernetic Control<br />(Autonomous Dispatch Core)
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        ✓ 28% Energy Conservation & Zero Labor Friction Verified
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-neutral-500 flex justify-between border-t border-white/[0.04] pt-2">
                  <span>ENTERPRISE ADVISORY PROTOTYPE</span>
                  <span>CONFIDENTIAL</span>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="text-xs font-mono text-cyan-400 tracking-wider">
                  CONSULTING CAPABILITIES / VALUE DELIVERED
                </div>
                <h4 className="text-lg font-normal text-white">
                  {cpsPhase === "phase1" && "01. 極限環境テレメトリと物理劣化モデリング"}
                  {cpsPhase === "phase2" && "02. 作業員の身体生態と地域雇用エコシステムの調停"}
                  {cpsPhase === "phase3" && "03. 完全自律フリート運行と閉ループ意思決定"}
                </h4>
                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  {cpsPhase === "phase1" && "標高4,000m超の低酸素・気圧低下による重機ブレーキやエンジンの熱力学劣化を、エッジセンシングデータからリアルタイム予測・補正するCPS基盤を設計します。"}
                  {cpsPhase === "phase2" && "完全無人化が引き起こす地域雇用の破壊や労働組合との摩擦を、ルーマン社会システム論（構造的結合）を用いてモデル化。人間と機械が共生する移行計画を策定。"}
                  {cpsPhase === "phase3" && "デジタルツイン上で運行シミュレーションを回し、天候や現場の突発摩擦に自律適応する運行ディスパッチアルゴリズムを提供します。"}
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-neutral-400">
                  <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/10">#Cyber-Physical Systems</span>
                  <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/10">#Heavy Industry</span>
                  <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/10">#Social Systems Theory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SAAS VENTURE (ST. COLLECTIVE - 10 MEMBERS / 3 REAL PRODUCTS) */}
      <section id="saas" className="relative z-10 py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 tracking-widest uppercase mb-2">
                <Layers3 size={12} />
                <span>VENTURE STUDIO // 10 BUILDERS, 3 PRODUCTS</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-light text-white">
                St. Collective <span className="font-serif italic text-neutral-400 text-2xl sm:text-3xl">/ Vertical Software Portfolio</span>
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-neutral-300">
                10 Core Builders
              </span>
              <span className="px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300">
                HotPepper API Sync Ready
              </span>
            </div>
          </div>

          {/* PRODUCT 1: St. Salon OS */}
          <div className="rounded-3xl border border-white/10 bg-[#080910] p-8 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="text-xs font-mono text-cyan-400">
                  FLAGSHIP 01 // VERTICAL WORKFLOW ENGINE
                </div>
                <h3 className="text-3xl font-normal text-white">
                  St. (Salon Experience OS)
                </h3>
                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  {lang === "JA"
                    ? "施術者の身体的なワークフロー、対面の顧客体験、複雑な店舗オペレーションを流麗なUIへ統合。現在は高機能モックを稼働させており、今後ホットペッパービューティー（HotPepper Beauty）等の外部基盤との双方向API連携を実装予定。"
                    : "Unifying tactile stylist scheduling, customer spatial trajectories, and complex salon workflows. Fully interactive prototype live, with bidirectional HotPepper Beauty API sync on the immediate roadmap."}
                </p>

                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-300">
                    <Workflow size={13} />
                    <span>NEXT ARCHITECTURE: HOTPEPPER BEAUTY API BIDIRECTIONAL SYNC</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    外部予約流入と店内施術進行をリアルタイム自動同期。二重予約の摩擦を融解。
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="https://dev-salon-moc.pages.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playChirp(600)}
                    className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                  >
                    <span>LAUNCH LIVE PROTOTYPE</span>
                    <ExternalLink size={14} />
                  </a>
                  <span className="text-xs font-mono text-neutral-500">
                    LIVE MOCK ON CLOUDFLARE
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
                  <span className="text-neutral-400">ST. SALON OS // MATRIX</span>
                  <span className="text-emerald-400">SYSTEM ONLINE</span>
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex justify-between">
                  <span className="text-neutral-400">Seat 01 (Color Dynamic)</span>
                  <span className="text-cyan-300">42 min remaining</span>
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex justify-between">
                  <span className="text-neutral-400">Seat 02 (Somatic Cut)</span>
                  <span className="text-emerald-300">Complete</span>
                </div>
                <div className="p-2 rounded bg-blue-950/40 border border-blue-500/20 flex justify-between">
                  <span className="text-blue-300">HotPepper Sync Webhook</span>
                  <span className="text-blue-400">Queued: 17:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT 2 & 3: St. Wander & St. SubZero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Product 02: St. Wander */}
            <div className="p-8 rounded-3xl border border-white/10 bg-[#080910] flex flex-col justify-between hover:border-cyan-500/40 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Headphones size={13} /> PRODUCT 02 // TRAVEL AUDIO-BOOK
                  </span>
                  <span className="text-neutral-500">LOCATION-AWARE</span>
                </div>
                <h4 className="text-2xl font-normal text-white group-hover:text-cyan-300 transition-colors">
                  St. Wander
                </h4>
                <p className="text-xs font-mono text-cyan-200/80">
                  Spatial Audio Travelogue & Landscape-Synced Narrative
                </p>
                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  旅の現在地・移動速度・地形標高にリアルタイム同期する「旅行版オーディオブック」。目にする景観の歴史や文化的文脈が立体音響で耳元に流れ込み、受動的な移動を身体的な探求体験へ変容させる。
                </p>
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
                  GPS & Elevation-Synced Procedural Audio Engine
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.06] text-xs font-mono text-neutral-500 flex justify-between">
                <span>ST. TRAVEL SUITE</span>
                <span className="text-cyan-400">Active Beta Q4</span>
              </div>
            </div>

            {/* Product 03: St. SubZero */}
            <div className="p-8 rounded-3xl border border-white/10 bg-[#080910] flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <RefreshCw size={13} /> PRODUCT 03 // HYPER-AUTOMATION
                  </span>
                  <span className="text-neutral-500">AGENTIC FINTECH</span>
                </div>
                <h4 className="text-2xl font-normal text-white group-hover:text-emerald-300 transition-colors">
                  St. SubZero
                </h4>
                <p className="text-xs font-mono text-emerald-200/80">
                  Hyper-Automated Subscription & Entitlement Lifecycle Engine
                </p>
                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  企業や個人の散在するSaaS契約・サブスクリプションを完全自動調停。シャドーITの自動検知、遊休アカウントの自律解約、利用実績に応じたプラン最適化をLLMエージェントが自律実行。
                </p>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                  Zero-Click Entitlement Discovery & Auto-Cancellation
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.06] text-xs font-mono text-neutral-500 flex justify-between">
                <span>ST. FINTECH FABRIC</span>
                <span className="text-emerald-400">Pipeline Alpha</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: BIO-COMPUTATIONAL MEDIA ARTWORKS */}
      <section id="media-art" className="relative z-10 py-24 border-t border-white/[0.06] bg-[#050508]/60">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-purple-400 tracking-widest uppercase mb-2">
                04 // SOLO ARTISTIC INQUIRY
              </div>
              <h2 className="text-3xl sm:text-5xl font-light text-white">
                Bio-Computational <span className="font-serif italic text-purple-300">Installations</span>
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-500 max-w-sm">
              人間の呼吸や潮汐の連続的ダイナミクスを計算機へ写像する作品群。クリックでライブ作品ビューアを展開。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Artwork 1: Tide Translator */}
            <div className="rounded-3xl border border-white/10 bg-[#080910] p-6 sm:p-8 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-xl group">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-cyan-400">ENVIRONMENTAL CPS ARTIFACT</span>
                  <span className="text-neutral-500">DYNAMIC COMPUTATION</span>
                </div>
                <h3 className="text-2xl font-normal text-white group-hover:text-cyan-300 transition-colors">
                  Tide Translator
                </h3>

                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.18),transparent_70%)]" />
                  
                  <div className="flex items-center gap-1.5 h-20 z-10">
                    {[35, 60, 25, 90, 45, 80, 40, 95, 30, 70, 50].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-cyan-400/80 rounded-full animate-pulse"
                        style={{
                          height: `${h}%`,
                          animationDuration: `${1.1 + (i % 3) * 0.4}s`
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setArtModalUrl("https://sites.google.com/view/tidetranslator/full-page-embed");
                      playChirp(680);
                    }}
                    className="absolute bottom-4 right-4 z-20 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all"
                  >
                    <Maximize2 size={12} />
                    <span>EXPAND LIVE WORK</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  潮汐の干満や流体力学的摩擦をセンサーとアルゴリズムで翻訳する環境CPS装置。不可視の自然現象を身体的スケールの知覚へ変換。
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">EXHIBITION ARTIFACT</span>
                <a
                  href="https://sites.google.com/view/tidetranslator/full-page-embed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Direct Site</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Artwork 2: Breath Digital */}
            <div className="rounded-3xl border border-white/10 bg-[#080910] p-6 sm:p-8 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xl group">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-purple-400">BIO-COMPUTATIONAL INTERFACE</span>
                  <span className="text-neutral-500">SOMATIC PERCEPTION</span>
                </div>
                <h3 className="text-2xl font-normal text-white group-hover:text-purple-300 transition-colors">
                  Breath Digital
                </h3>

                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_70%)]" />
                  
                  <div className="relative flex items-center justify-center z-10">
                    <div className="w-24 h-24 rounded-full border border-purple-500/50 animate-ping opacity-60" style={{ animationDuration: '4s' }} />
                    <div className="w-18 h-18 rounded-full bg-purple-600/20 border border-purple-400/60 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-purple-200">RESPIRATION</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setArtModalUrl("https://sites.google.com/view/breath-digital/full-page-embed");
                      playChirp(680);
                    }}
                    className="absolute bottom-4 right-4 z-20 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all"
                  >
                    <Maximize2 size={12} />
                    <span>EXPAND LIVE WORK</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  人間の「呼吸」という脆く連続的な生体現象を計算機空間に同期させるインスタレーション。身体的現実とデジタルの抽象性が交差する界面を問う。
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">BIO-INTERFACE</span>
                <a
                  href="https://sites.google.com/view/breath-digital/full-page-embed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>Direct Site</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: DIALOGUE & CONTACT */}
      <section id="dialogue" className="relative z-10 py-24 border-t border-white/[0.06] bg-gradient-to-t from-black to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <div className="text-xs font-mono text-blue-400 tracking-widest uppercase">
              05 // INITIATE DIALOGUE
            </div>
            <h2 className="text-4xl sm:text-6xl font-light tracking-tight text-white">
              Initiate a dialogue.
            </h2>
            <p className="text-neutral-400 font-light text-sm sm:text-base leading-relaxed">
              SaaSブランド「St.」への出資・事業提携、メディアアートの出展・コミッションワーク、重工業CPSおよびオントロジー標準化のコンサルティング、社会システム論の共同研究など、あらゆる高解像度な対話を歓迎します。
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href="mailto:sito79646@gmail.com?subject=[Inquiry]%20Dialogue%20with%20kisaragi"
                onClick={() => playChirp(620)}
                className="px-8 py-4 rounded-full bg-white text-black font-medium text-xs font-mono tracking-wider hover:bg-neutral-200 transition-all flex items-center gap-3 shadow-[0_0_35px_rgba(255,255,255,0.25)]"
              >
                <Mail size={16} />
                <span>sito79646@gmail.com</span>
                <ArrowUpRight size={14} className="text-neutral-500" />
              </a>
              <span className="text-xs font-mono text-neutral-500">
                Direct encrypted mail. Response within 24-48 hours.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 text-xs font-mono text-neutral-500 bg-[#030305]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© 2026 KISARAGI. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6 text-neutral-400">
            <span>ST. COLLECTIVE</span>
            <span>CPS ONTOLOGY</span>
            <span>DIGITAL NATURE</span>
          </div>
        </div>
      </footer>

      {/* FULL EMBED MODAL FOR ARTWORKS */}
      {artModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-mono text-neutral-400">
            <span className="text-cyan-400 flex items-center gap-2">
              <Radio size={13} className="animate-pulse" /> LIVE ARTIFACT FULL EMBED
            </span>
            <button 
              onClick={() => setArtModalUrl(null)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-[11px]"
            >
              CLOSE [ESC]
            </button>
          </div>
          <div className="flex-1 w-full h-full pt-4">
            <iframe 
              src={artModalUrl} 
              className="w-full h-full rounded-2xl border border-white/10 bg-black"
              title="Live Artwork Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
}