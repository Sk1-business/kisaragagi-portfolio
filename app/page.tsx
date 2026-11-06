"use client";

import React, { useState } from "react";
import { 
  ArrowUpRight, 
  Layers, 
  Cpu, 
  Palette, 
  Compass, 
  ExternalLink, 
  Mail, 
  Globe2 
} from "lucide-react";

export default function Home() {
  const [lang, setLang] = useState<"EN" | "JA">("EN");

  const toggleLang = () => setLang((prev) => (prev === "EN" ? "JA" : "EN"));

  const domains = [
    {
      num: "01",
      icon: Layers,
      title: "SaaS Venture",
      brand: "St.",
      tag: "Spatial & Workflow OS",
      desc_en: "Architecting software ecosystems tailored for physical frontlines, removing sensory and operational friction.",
      desc_ja: "過酷な対面現場や身体的な作業動線に寄り添い、摩擦を融解させるバーティカルSaaSブランド。",
    },
    {
      num: "02",
      icon: Cpu,
      title: "Tech Consulting",
      brand: "CPS & Ontology",
      tag: "System Architecture",
      desc_en: "Synthesizing heavy industry telemetry, mathematical models, and tacit artisan knowledge into knowledge graphs.",
      desc_ja: "重工業の現場から数理モデル、熟練工の身体知までを包括する知識オントロジーとCPS構想策定。",
    },
    {
      num: "03",
      icon: Palette,
      title: "Media Art",
      brand: "Artifacts",
      tag: "Computational Perception",
      desc_en: "Exploring the fragile intersection of computational structures and somatic phenomena (breath, tidal resonance).",
      desc_ja: "呼吸や潮汐など、自然・生体の不可視なダイナミクスを計算機知覚と接続する空間的表現。",
    },
    {
      num: "04",
      icon: Compass,
      title: "Social Research",
      brand: "Ethnography",
      tag: "Systems Theory",
      desc_en: "Bridging Luhmann-inspired social systems theory with frontline ethnographic inquiry into institutional friction.",
      desc_ja: "ルーマン的社会システム論を足場に、現場の泥臭い摩擦と制度的力学を解き明かす質的調査。",
    },
  ];

  const works = [
    {
      category: "SaaS Venture",
      title: "St. (Salon Experience OS)",
      subtitle: "Vertical Workflow & Spatial Management Platform",
      desc_en: "An intuitive SaaS for beauty salon ecosystems. Unifies physical customer journeys, somatic artisan scheduling, and operational intelligence into a fluid interface.",
      desc_ja: "美容サロンの現場摩擦を解くバーティカルSaaS。施術者の身体的なワークフロー、対面の顧客体験、複雑な店舗オペレーションを流麗なUIへ統合。",
      link: "https://dev-salon-moc.pages.dev/",
      tags: ["SaaS", "Prototype", "Workflow Architecture"],
    },
    {
      category: "Media Art",
      title: "Breath Digital",
      subtitle: "Bio-Computational Installation",
      desc_en: "Translating the fragile, continuous biological phenomenon of human breathing into a digital computational substrate, exploring where somatic reality meets digital abstraction.",
      desc_ja: "人間の「呼吸」という脆く連続的な生体現象を計算機空間に同期させるインスタレーション。身体的現実とデジタルの抽象性が交差する界面を問う。",
      link: "https://sites.google.com/view/breath-digital/full-page-embed",
      tags: ["Installation", "Sensory Interface", "Embodiment"],
    },
    {
      category: "Media Art",
      title: "Tide Translator",
      subtitle: "Environmental CPS Artifact",
      desc_en: "An environmental translation artifact capturing dynamic tidal rhythms, converting fluid natural friction into structured algorithmic resonance.",
      desc_ja: "潮汐の満ち引きや流体力学的な摩擦をセンサーとアルゴリズムで翻訳する環境CPS装置。不可視の自然現象を身体的スケールの知覚へ変換。",
      link: "https://sites.google.com/view/tidetranslator/full-page-embed",
      tags: ["CPS", "Dynamic Computation", "Environment"],
    },
    {
      category: "Tech Consulting",
      title: "Autonomous Mining CPS Blueprint",
      subtitle: "High-Altitude Logistics & Human Ecology (Latin America)",
      desc_en: "Designed an end-to-end Cyber-Physical Systems (CPS) architecture for large-scale mining operations. Modeled environmental degradation, heavy fleet telemetry, and operator somatic stress to optimize autonomous dispatch without disrupting local labor ecosystems.",
      desc_ja: "中南米の大規模露天掘り鉱山におけるCPS構想策定。高地環境の物理的制約、重機テレメトリ、作業員の身体的負荷を統合モデル化し、現地の雇用環境に配慮した自動運行アーキテクチャを設計。",
      confidential: true,
      tags: ["Cyber-Physical Systems", "Heavy Industry", "Strategic Architecture"],
    },
    {
      category: "Tech Consulting / AI",
      title: "Heavy Manufacturing Knowledge Graph",
      subtitle: "Ontological Architecture & Artisan Tacit Knowledge",
      desc_en: "Constructed a domain-specific knowledge ontology unifying decades of tacit artisan expertise with automated sensor feeds across the production line, replacing fragmented ERP/MES silos with a semantic data fabric.",
      desc_ja: "重工業製造ラインにおける暗黙知とセンシングデータを統合するドメインオントロジー設計。数十年におよぶ熟練工の身体知を形式知化し、分断された基幹システムをセマンティックに接続。",
      confidential: true,
      tags: ["Ontology", "Enterprise AI", "Tacit Knowledge"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F7] antialiased selection:bg-[#3B82F6]/30 selection:text-white font-sans">
      {/* Dynamic Background Grid Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070708]/75 border-b border-white/[0.06] transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-medium tracking-tight text-lg text-white hover:opacity-80 transition-opacity">
            kisaragi
          </a>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-neutral-400">
              <a href="#philosophy" className="hover:text-white transition-colors">PHILOSOPHY</a>
              <a href="#domains" className="hover:text-white transition-colors">DOMAINS</a>
              <a href="#works" className="hover:text-white transition-colors">SELECTED WORKS</a>
              <a href="#contact" className="hover:text-white transition-colors">CONTACT</a>
            </nav>

            <button 
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all text-neutral-300"
              aria-label="Toggle Language"
            >
              <Globe2 size={13} className="text-neutral-400" />
              <span>{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 max-w-6xl mx-auto px-6">
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-mono tracking-wider">
            <span>SOCIO-TECHNOLOGY & PHYSICAL IMPLEMENTATION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white leading-[1.08]">
            Socio-Technology <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 via-neutral-400 to-neutral-600">
              into Reality.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 font-light leading-relaxed max-w-2xl pt-2">
            {lang === "EN" ? (
              "Bridging abstract social systems theory and gritty physical friction. Grounded in AI, ontology, CPS, and embodied human practice."
            ) : (
              "社会システム論 × 物理実装。現場の泥臭い摩擦と身体性を解く「社会技術」の実践。"
            )}
          </p>

          <div className="pt-6 flex flex-wrap gap-y-2 gap-x-4 text-xs font-mono text-neutral-400 border-t border-white/[0.08]">
            <span>Tech Consultant</span>
            <span className="text-neutral-600">/</span>
            <span>Founder & CEO of St.</span>
            <span className="text-neutral-600">/</span>
            <span>Media Artist</span>
            <span className="text-neutral-600">/</span>
            <span>Social Researcher</span>
          </div>
        </div>
      </section>

      {/* Philosophy / Manifesto */}
      <section id="philosophy" className="py-24 border-t border-white/[0.06] bg-gradient-to-b from-transparent to-[#0d0e12]/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-4">
            01 — MANIFESTO
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            <h2 className="md:col-span-5 text-2xl sm:text-3xl font-normal tracking-tight text-white leading-snug">
              {lang === "EN" ? (
                <>Pure logic cannot survive the chaos of the frontline.</>
              ) : (
                <>純粋な数理や論理だけでは、現場の混沌を超えることはできない。</>
              )}
            </h2>

            <div className="md:col-span-7 space-y-6 text-neutral-400 font-light leading-relaxed text-sm sm:text-base">
              {lang === "EN" ? (
                <>
                  <p>
                    While computational models, ontologies, and digital twins describe ideal systems, the actual world operates through physical limits, tactile friction, and embodied human habits.
                  </p>
                  <p>
                    Across heavy industrial terrains, vertical software products, and interactive bio-media installations, I design socio-technological frameworks that breathe with physical reality.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    デジタルツインやAIがどれほど洗練された数理モデルを描こうとも、現実の生産現場や日常の店舗は、常に泥臭い物理的制約、摩擦、そして人々の身体的な知覚・実践によって動いています。
                  </p>
                  <p>
                    理論上の社会システム論と泥臭い物理実装のあいだに橋を架けること。重工業のオペレーションからソフトウェア、そして空間的メディアアートに至るまで、現実の手触りと同期するアーキテクチャを探求しています。
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Four Domains of Practice */}
      <section id="domains" className="py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-4">
            02 — DOMAINS OF PRACTICE
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-12">
            Four dimensions of a single philosophy.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {domains.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-neutral-400 mb-6 font-mono text-xs">
                      <span>{item.num}</span>
                      <Icon size={16} className="text-neutral-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="text-xs font-mono text-blue-400 mb-1">{item.brand}</div>
                    <h3 className="text-lg font-medium text-white mb-3">{item.title}</h3>
                    <p className="text-neutral-400 text-xs leading-relaxed font-light">
                      {lang === "EN" ? item.desc_en : item.desc_ja}
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-white/[0.04] text-[11px] font-mono text-neutral-400">
                    {item.tag}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected Works (Projects) */}
      <section id="works" className="py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-4">
            03 — SELECTED WORKS & BLUEPRINTS
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-12">
            Somatic interfaces, software, and industrial architectures.
          </h2>

          <div className="space-y-6">
            {works.map((work, idx) => (
              <div 
                key={idx}
                className="group relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-blue-400 tracking-wider">
                        {work.category}
                      </span>
                      {work.confidential && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-neutral-700 text-neutral-400">
                          Enterprise / Confidential
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-medium text-white group-hover:text-blue-300 transition-colors">
                      {work.title}
                    </h3>
                    <p className="text-xs font-mono text-neutral-400">
                      {work.subtitle}
                    </p>

                    <p className="text-neutral-400 text-sm leading-relaxed font-light pt-2">
                      {lang === "EN" ? work.desc_en : work.desc_ja}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {work.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[11px] font-mono text-neutral-400 bg-white/[0.04] px-2.5 py-1 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {work.link && (
                    <a
                      href={work.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start inline-flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/20 text-white transition-all duration-200"
                    >
                      <span>Explore</span>
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 border-t border-white/[0.06] bg-gradient-to-t from-black to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl space-y-6">
            <div className="text-xs font-mono text-blue-400 tracking-widest uppercase">
              04 — DIALOGUE
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
              Initiate a dialogue.
            </h2>

            <p className="text-neutral-400 font-light text-sm sm:text-base leading-relaxed">
              {lang === "EN" ? (
                "Open for high-impact industrial consulting, enterprise CPS architecture, artistic commissions, social research, and partnerships around SaaS brand St."
              ) : (
                "重工業・製造業のCPS・オントロジー構想策定、研究提携、アート出展・コミッションワーク、SaaS「St.」に関するご相談など、あらゆる対話を歓迎します。"
              )}
            </p>

            <div className="pt-4">
              <a 
                href="mailto:sito79646@gmail.com"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <Mail size={16} />
                <span>sito79646@gmail.com</span>
                <ArrowUpRight size={14} className="text-neutral-500" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-white/[0.06] py-10 text-xs font-mono text-neutral-400">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© 2026 kisaragi. All rights reserved.</div>
          <div className="flex gap-6">
            <span>St. Brand</span>
            <span>Social Systems × CPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}