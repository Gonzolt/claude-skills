#!/usr/bin/env node
/**
 * generate-drawio.mjs
 *
 * Generates 5 draw.io diagrams illustrating oh-my-patent's multi-agent
 * collaboration patterns, saves them as .drawio files in docs/images/,
 * and opens each in the browser via the draw.io URL scheme.
 *
 * Replicates the URL generation logic of @drawio/mcp (jgraph/drawio-mcp):
 *   deflateRaw(encodeURIComponent(xml)) -> base64 -> #create= JSON hash
 */

import { deflateRawSync } from "zlib";
import { writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const DRAWIO_BASE = "https://app.diagrams.net/";

// ============================================================================
// URL generation (mirrors @drawio/mcp src/index.js)
// ============================================================================

function compressData(data) {
  const encoded = encodeURIComponent(data);
  const compressed = deflateRawSync(Buffer.from(encoded));
  return Buffer.from(compressed).toString("base64");
}

function generateDrawioUrl(xml) {
  const compressed = compressData(xml);
  const createObj = { type: "xml", compressed: true, data: compressed };
  const params = new URLSearchParams();
  params.set("grid", "0");
  params.set("pv", "0");
  params.set("border", "10");
  params.set("edit", "_blank");
  return DRAWIO_BASE + "?" + params.toString() + "#create=" + encodeURIComponent(JSON.stringify(createObj));
}

function openBrowser(url) {
  // Windows: cmd start drops the # fragment, so write a .url shortcut file.
  if (process.platform === "win32") {
    const tmpFile = join(tmpdir(), `drawio-gen-${Date.now()}.url`);
    writeFileSync(tmpFile, `[InternetShortcut]\r\nURL=${url}\r\n`);
    spawn("cmd", ["/c", "start", "", tmpFile], { shell: false, stdio: "ignore" }).unref();
    setTimeout(() => { try { unlinkSync(tmpFile); } catch {} }, 10000);
  } else if (process.platform === "darwin") {
    spawn("open", [url], { shell: false, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { shell: false, stdio: "ignore" }).unref();
  }
}

// ============================================================================
// Shared style helpers
// ============================================================================

// Color palette (modern, professional)
const C = {
  bg: "#f8fafc",
  orchestrator: "#6366f1",   // indigo — Archimedes
  research: "#0ea5e9",       // sky
  brainstorm: "#f59e0b",     // amber
  draft: "#10b981",          // emerald
  qa: "#ef4444",             // red
  diagram: "#8b5cf6",        // violet
  done: "#22c55e",           // green
  agent: "#3b82f6",          // blue
  attacker: "#dc2626",       // red-600
  moderator: "#7c3aed",      // violet-600
  evaluator: "#0891b2",      // cyan
  security: "#b91c1c",       // red-700
  compliance: "#c2410c",     // orange-700
  writer: "#059669",         // emerald-600
  reviewer: "#be123c",       // rose-700
  responder: "#0d9488",      // teal-600
  node: "#ffffff",
  text: "#0f172a",
  edge: "#475569",
  edgeActive: "#1e40af",
  edgeAttack: "#dc2626",
  edgeFeedback: "#7c3aed",
};

function stageStyle(color) {
  return `rounded=1;whiteSpace=wrap;html=1;fillColor=${color};strokeColor=${color};fontColor=#ffffff;fontSize=13;fontStyle=1;arcSize=12;shadow=1;`;
}

function agentStyle(color) {
  return `rounded=1;whiteSpace=wrap;html=1;fillColor=${color};strokeColor=${color};fontColor=#ffffff;fontSize=12;arcSize=20;shadow=1;`;
}

function noteStyle(color = C.text) {
  return `text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=${color};fontSize=11;`;
}

function edgeStyle(color = C.edge, dashed = false, width = 2) {
  return `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=${color};strokeWidth=${width};fontColor=${C.text};fontSize=11;${dashed ? "dashed=1;" : ""}endArrow=block;`;
}

function attackEdgeStyle() {
  return `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=${C.edgeAttack};strokeWidth=2.5;dashed=1;endArrow=block;endFill=1;fontColor=${C.edgeAttack};fontSize=11;`;
}

function feedbackEdgeStyle() {
  return `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=${C.edgeFeedback};strokeWidth=2;dashed=1;endArrow=block;fontColor=${C.edgeFeedback};fontSize=11;`;
}

// ============================================================================
// Diagram builders — each returns draw.io mxGraphModel XML
// ============================================================================

// ----------------------------------------------------------------------------
// Diagram 1: 总流程编排 — Archimedes 主编排器 + 10 阶段状态机
// ----------------------------------------------------------------------------

function diagram1Orchestration() {
  const stages = [
    { id: "s1",  x: 60,   y: 200, w: 130, h: 56, label: "INIT",            color: C.orchestrator, agent: "用户选题" },
    { id: "s2",  x: 230,  y: 200, w: 130, h: 56, label: "RESEARCH",        color: C.research,     agent: "landscape-analyst" },
    { id: "s3",  x: 400,  y: 200, w: 140, h: 56, label: "BRAINSTORM_R1",   color: C.brainstorm,   agent: "architect + examiner" },
    { id: "s4",  x: 580,  y: 200, w: 140, h: 56, label: "BRAINSTORM_R2",   color: C.brainstorm,   agent: "security + compliance + evaluator" },
    { id: "s5",  x: 760,  y: 200, w: 110, h: 56, label: "DRAFT",           color: C.draft,        agent: "disclosure-writer" },
    { id: "s6",  x: 910,  y: 200, w: 140, h: 56, label: "DIAGRAM_DRAFT",   color: C.diagram,      agent: "diagram-generator" },
    { id: "s7",  x: 1090, y: 200, w: 110, h: 56, label: "QA_LOOP",         color: C.qa,           agent: "reviewer ↔ responder" },
    { id: "s8",  x: 1240, y: 200, w: 140, h: 56, label: "FINAL_REVIEW",    color: C.qa,           agent: "reviewer" },
    { id: "s9",  x: 1240, y: 320, w: 140, h: 56, label: "DIAGRAM_FINAL",   color: C.diagram,      agent: "diagram-generator" },
    { id: "s10", x: 1240, y: 420, w: 140, h: 56, label: "DONE",            color: C.done,         agent: "quality-gate" },
  ];

  let cells = "";

  // Title
  cells += `    <mxCell id="title" value="oh-my-patent 工作流编排：Archimedes 主编排器路由 11 个专家智能体" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;fontColor=${C.text};" vertex="1" parent="1"><mxGeometry x="200" y="80" width="1000" height="40" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="subtitle" value="10 阶段状态机 (INIT → DONE)  ·  Archimedes 读取 state.json 路由  ·  每阶段产出落盘 references/" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontColor=#64748b;" vertex="1" parent="1"><mxGeometry x="200" y="115" width="1000" height="24" as="geometry" /></mxCell>\n`;

  // Archimedes orchestrator band (top)
  cells += `    <mxCell id="archimedes" value="Archimedes 主编排器&#10;读取 .patent/state.json · 按 current_stage 分派子代理 · 整合输出" style="${agentStyle(C.orchestrator)}fontSize=14;" vertex="1" parent="1"><mxGeometry x="400" y="150" width="600" height="36" as="geometry" /></mxCell>\n`;

  // Stages
  for (const s of stages) {
    cells += `    <mxCell id="${s.id}" value="${s.label}" style="${stageStyle(s.color)}" vertex="1" parent="1"><mxGeometry x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" as="geometry" /></mxCell>\n`;
    cells += `    <mxCell id="${s.id}_a" value="${s.agent}" style="${noteStyle("#475569")}" vertex="1" parent="1"><mxGeometry x="${s.x}" y="${s.y + s.h + 4}" width="${s.w}" height="34" as="geometry" /></mxCell>\n`;
  }

  // Forward edges
  const forward = [
    ["s1","s2"],["s2","s3"],["s3","s4"],["s4","s5"],["s5","s6"],["s6","s7"],["s7","s8"]
  ];
  for (const [f,t] of forward) {
    cells += `    <mxCell id="e_${f}_${t}" style="${edgeStyle(C.edge, false, 2)}" edge="1" parent="1" source="${f}" target="${t}"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  }
  // s8 -> s9 -> s10
  cells += `    <mxCell id="e_s8_s9" style="${edgeStyle(C.edge, false, 2)}" edge="1" parent="1" source="s8" target="s9"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_s9_s10" style="${edgeStyle(C.edge, false, 2)}" edge="1" parent="1" source="s9" target="s10"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Loop-back edges: QA_LOOP -> DRAFT, FINAL_REVIEW -> QA_LOOP
  cells += `    <mxCell id="e_s7_s5" value="新问题：回 DRAFT" style="${feedbackEdgeStyle()}exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="s7" target="s5"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="1145" y="120" /><mxPoint x="815" y="120" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="e_s8_s7" value="未通过：回 QA" style="${feedbackEdgeStyle()}exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;" edge="1" parent="1" source="s8" target="s7"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Persistence band (bottom)
  cells += `    <mxCell id="persist" value="持久化层&#10;.patent/state.json (原子写)  ·  .brainstorm/path.json (DAG)  ·  references/*.md  ·  MAIN.md  ·  figures/" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${C.bg};strokeColor=#cbd5e1;fontColor=${C.text};fontSize=12;arcSize=8;align=left;spacingLeft=12;dashed=1;" vertex="1" parent="1"><mxGeometry x="60" y="510" width="1320" height="60" as="geometry" /></mxCell>\n`;

  // Threshold gate annotation
  cells += `    <mxCell id="gate" value="阈值门禁&#10;综合分 ≥ 8.5&#10;新颖性 ≥ 6.0&#10;创造性 ≥ 6.0&#10;最大 3 轮" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=${C.brainstorm};fontColor=${C.text};fontSize=11;shadow=1;" vertex="1" parent="1"><mxGeometry x="430" y="320" width="120" height="90" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_s4_gate" style="${edgeStyle(C.brainstorm, true, 1.5)}" edge="1" parent="1" source="s4" target="gate"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_gate_s5" value="PASS" style="${edgeStyle(C.done, false, 2)}" edge="1" parent="1" source="gate" target="s5"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="490" y="280" /><mxPoint x="760" y="280" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="e_gate_s3" value="ITERATE" style="${feedbackEdgeStyle()}" edge="1" parent="1" source="gate" target="s3"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="380" y="365" /><mxPoint x="380" y="228" /></Array></mxGeometry></mxCell>\n`;

  // Legend
  cells += `    <mxCell id="legend_title" value="图例" style="${noteStyle(C.text)}fontStyle=1;" vertex="1" parent="1"><mxGeometry x="60" y="610" width="60" height="20" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="legend1" value="正向流转" style="${stageStyle(C.research)}fontSize=11;" vertex="1" parent="1"><mxGeometry x="60" y="640" width="100" height="30" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="legend2" value="回溯/迭代" style="${stageStyle(C.qa)}fontSize=11;" vertex="1" parent="1"><mxGeometry x="180" y="640" width="100" height="30" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="legend3" value="阈值决策" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=${C.brainstorm};fontColor=${C.text};fontSize=11;" vertex="1" parent="1"><mxGeometry x="300" y="635" width="100" height="40" as="geometry" /></mxCell>\n`;

  return cells;
}

// ----------------------------------------------------------------------------
// Diagram 2: R1 对抗式头脑风暴 — architect vs examiner
// ----------------------------------------------------------------------------

function diagram2Adversarial() {
  let cells = "";

  cells += `    <mxCell id="title" value="R1 对抗式头脑风暴：提案 ↔ 攻击，moderator 仲裁" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;fontColor=${C.text};" vertex="1" parent="1"><mxGeometry x="200" y="40" width="1000" height="36" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="subtitle" value="同一轮内并行调用：创新架构师产出候选，对抗审查员逐条攻击，主持人汇总评分决策" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontColor=#64748b;" vertex="1" parent="1"><mxGeometry x="200" y="76" width="1000" height="22" as="geometry" /></mxCell>\n`;

  // Archimedes at top
  cells += `    <mxCell id="arch" value="Archimedes (编排)" style="${agentStyle(C.orchestrator)}" vertex="1" parent="1"><mxGeometry x="600" y="120" width="200" height="40" as="geometry" /></mxCell>\n`;

  // Two opposing agents
  cells += `    <mxCell id="architect" value="patent-innovation-architect&#10;&#10;TRIZ 方法生成创新点候选&#10;· 输出 INN-001/002/003&#10;· 核心方案 + 差异点&#10;· 落盘 brainstorm_round1_*.md" style="${agentStyle(C.agent)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="120" y="220" width="320" height="120" as="geometry" /></mxCell>\n`;

  cells += `    <mxCell id="examiner" value="patent-adversarial-examiner&#10;&#10;对抗式审查/无效视角&#10;· 10-15 条质疑（按严重度）&#10;· 每条给硬限定点&#10;· 落盘 argue_round1_*.md" style="${agentStyle(C.attacker)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="960" y="220" width="320" height="120" as="geometry" /></mxCell>\n`;

  // VS badge
  cells += `    <mxCell id="vs" value="VS" style="ellipse;whiteSpace=wrap;html=1;fillColor=${C.text};strokeColor=${C.text};fontColor=#ffffff;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1"><mxGeometry x="660" y="250" width="80" height="80" as="geometry" /></mxCell>\n`;

  // Attack edges (architect -> examiner with attacks)
  cells += `    <mxCell id="atk1" value="质疑新颖性" style="${attackEdgeStyle()}" edge="1" parent="1" source="architect" target="examiner"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="440" y="240" /><mxPoint x="960" y="240" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="atk2" value="质疑创造性" style="${attackEdgeStyle()}" edge="1" parent="1" source="architect" target="examiner"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="440" y="280" /><mxPoint x="960" y="280" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="atk3" value="质疑可实施性" style="${attackEdgeStyle()}" edge="1" parent="1" source="architect" target="examiner"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="440" y="320" /><mxPoint x="960" y="320" /></Array></mxGeometry></mxCell>\n`;

  // Archimedes dispatch
  cells += `    <mxCell id="e_arch_a" style="${edgeStyle(C.orchestrator)}" edge="1" parent="1" source="arch" target="architect"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_arch_e" style="${edgeStyle(C.orchestrator)}" edge="1" parent="1" source="arch" target="examiner"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Moderator at bottom
  cells += `    <mxCell id="moderator" value="patent-brainstorm-moderator (主持人)&#10;&#10;汇总评分 · 阈值判断 · 决策输出" style="${agentStyle(C.moderator)}fontSize=13;" vertex="1" parent="1"><mxGeometry x="500" y="420" width="400" height="60" as="geometry" /></mxCell>\n`;

  cells += `    <mxCell id="e_a_mod" value="候选方案" style="${edgeStyle(C.agent)}" edge="1" parent="1" source="architect" target="moderator"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="280" y="400" /><mxPoint x="560" y="400" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="e_e_mod" value="质疑清单" style="${edgeStyle(C.attacker)}" edge="1" parent="1" source="examiner" target="moderator"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="1120" y="400" /><mxPoint x="840" y="400" /></Array></mxGeometry></mxCell>\n`;

  // Scoring table
  cells += `    <mxCell id="score_box" value="评分公式&#10;&#10;综合分 = 新颖性×0.3 + 创造性×0.3 + 实用性×0.2 + 商业价值×0.2&#10;&#10;阈值：综合分 ≥ 8.5 → PASS_TO_DRAFT&#10;红线：新颖性 &lt; 6.0 或创造性 &lt; 6.0 → ITERATE&#10;上限：3 轮未达标 → FORCE_PASS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=${C.brainstorm};fontColor=${C.text};fontSize=12;align=left;spacingLeft=16;shadow=1;" vertex="1" parent="1"><mxGeometry x="120" y="520" width="520" height="140" as="geometry" /></mxCell>\n`;

  // Decision outputs
  cells += `    <mxCell id="dec_pass" value="PASS_TO_DRAFT&#10;进入撰写" style="${stageStyle(C.done)}" vertex="1" parent="1"><mxGeometry x="700" y="540" width="180" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="dec_iter" value="ITERATE&#10;进入 R2 深度评估" style="${stageStyle(C.brainstorm)}" vertex="1" parent="1"><mxGeometry x="900" y="540" width="180" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="dec_force" value="FORCE_PASS&#10;达最大轮数" style="${stageStyle(C.evaluator)}" vertex="1" parent="1"><mxGeometry x="1100" y="540" width="180" height="50" as="geometry" /></mxCell>\n`;

  cells += `    <mxCell id="e_mod_pass" style="${edgeStyle(C.done)}" edge="1" parent="1" source="moderator" target="dec_pass"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_mod_iter" style="${edgeStyle(C.brainstorm)}" edge="1" parent="1" source="moderator" target="dec_iter"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_mod_force" style="${edgeStyle(C.evaluator)}" edge="1" parent="1" source="moderator" target="dec_force"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Path recorder
  cells += `    <mxCell id="recorder" value="patent-path-recorder&#10;持久化 .brainstorm/nodes/round-1.json&#10;创新点快照 + 评分 + 决策" style="${agentStyle(C.evaluator)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="500" y="700" width="400" height="60" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_mod_rec" value="强制落盘" style="${feedbackEdgeStyle()}" edge="1" parent="1" source="moderator" target="recorder"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  return cells;
}

// ----------------------------------------------------------------------------
// Diagram 3: R2 多维评估 — security + compliance + evaluator 并行
// ----------------------------------------------------------------------------

function diagram3ParallelEval() {
  let cells = "";

  cells += `    <mxCell id="title" value="R2 多维评估：三路并行审查 + 主持人加权汇总" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;fontColor=${C.text};" vertex="1" parent="1"><mxGeometry x="200" y="40" width="1000" height="36" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="subtitle" value="R1 通过后进入 R2：三个专家智能体从不同维度独立评估，moderator 汇总形成最终决策" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontColor=#64748b;" vertex="1" parent="1"><mxGeometry x="200" y="76" width="1000" height="22" as="geometry" /></mxCell>\n`;

  // Archimedes
  cells += `    <mxCell id="arch" value="Archimedes (编排)" style="${agentStyle(C.orchestrator)}" vertex="1" parent="1"><mxGeometry x="600" y="120" width="200" height="40" as="geometry" /></mxCell>\n`;

  // R1 input
  cells += `    <mxCell id="r1" value="R1 产出&#10;创新点候选 + 评分" style="${stageStyle(C.brainstorm)}" vertex="1" parent="1"><mxGeometry x="80" y="125" width="160" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_r1_arch" style="${edgeStyle(C.brainstorm)}" edge="1" parent="1" source="r1" target="arch"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Three parallel evaluators
  cells += `    <mxCell id="security" value="patent-security-engineer&#10;&#10;安全边界审查&#10;· 密码学方案合理性&#10;· 侧信道风险&#10;· 权限模型漏洞&#10;· 落盘 brainstorm_round2_*.md" style="${agentStyle(C.security)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="120" y="220" width="300" height="130" as="geometry" /></mxCell>\n`;

  cells += `    <mxCell id="compliance" value="patent-product-compliance-analyst&#10;&#10;法规合规审查&#10;· 数据隐私 (GDPR/PIPL)&#10;· 行业标准符合度&#10;· 出口管制风险&#10;· 落盘 brainstorm_round2_*.md" style="${agentStyle(C.compliance)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="550" y="220" width="300" height="130" as="geometry" /></mxCell>\n`;

  cells += `    <mxCell id="evaluator" value="patentability-evaluator&#10;&#10;可专利性评估&#10;· 新颖性检索对比&#10;· 创造性 (非显而易见)&#10;· 实用性验证&#10;· 落盘 brainstorm_round2_*.md" style="${agentStyle(C.evaluator)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="980" y="220" width="300" height="130" as="geometry" /></mxCell>\n`;

  // Fan-out from archimedes
  cells += `    <mxCell id="e_arch_sec" style="${edgeStyle(C.orchestrator)}" edge="1" parent="1" source="arch" target="security"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_arch_comp" style="${edgeStyle(C.orchestrator)}" edge="1" parent="1" source="arch" target="compliance"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_arch_eval" style="${edgeStyle(C.orchestrator)}" edge="1" parent="1" source="arch" target="evaluator"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Parallel badge
  cells += `    <mxCell id="parallel" value="并行执行&#10;parallel" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=${C.brainstorm};fontColor=${C.text};fontSize=11;fontStyle=2;dashed=1;" vertex="1" parent="1"><mxGeometry x="640" y="370" width="120" height="40" as="geometry" /></mxCell>\n`;

  // Moderator aggregation
  cells += `    <mxCell id="moderator" value="patent-brainstorm-moderator (主持人)&#10;加权汇总 · 阈值决策" style="${agentStyle(C.moderator)}fontSize=13;" vertex="1" parent="1"><mxGeometry x="450" y="450" width="500" height="50" as="geometry" /></mxCell>\n`;

  cells += `    <mxCell id="e_sec_mod" value="安全风险" style="${edgeStyle(C.security)}" edge="1" parent="1" source="security" target="moderator"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="270" y="420" /><mxPoint x="510" y="420" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="e_comp_mod" value="合规风险" style="${edgeStyle(C.compliance)}" edge="1" parent="1" source="compliance" target="moderator"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_eval_mod" value="可专利性分" style="${edgeStyle(C.evaluator)}" edge="1" parent="1" source="evaluator" target="moderator"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="1130" y="420" /><mxPoint x="890" y="420" /></Array></mxGeometry></mxCell>\n`;

  // Weighted score formula
  cells += `    <mxCell id="formula" value="加权综合分 = 新颖性×0.3 + 创造性×0.3 + 实用性×0.2 + 商业价值×0.2&#10;阈值 8.5  ·  红线 6.0  ·  最大 3 轮" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=${C.brainstorm};fontColor=${C.text};fontSize=12;align=center;shadow=1;" vertex="1" parent="1"><mxGeometry x="350" y="530" width="700" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_mod_form" style="${feedbackEdgeStyle()}" edge="1" parent="1" source="moderator" target="formula"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Outputs
  cells += `    <mxCell id="out_pass" value="PASS_TO_DRAFT&#10;→ DRAFT 阶段" style="${stageStyle(C.done)}" vertex="1" parent="1"><mxGeometry x="380" y="620" width="220" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="out_iter" value="ITERATE&#10;→ 回 R1" style="${stageStyle(C.brainstorm)}" vertex="1" parent="1"><mxGeometry x="640" y="620" width="220" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="out_force" value="FORCE_PASS&#10;→ DRAFT（达上限）" style="${stageStyle(C.evaluator)}" vertex="1" parent="1"><mxGeometry x="900" y="620" width="220" height="50" as="geometry" /></mxCell>\n`;

  cells += `    <mxCell id="e_form_pass" style="${edgeStyle(C.done)}" edge="1" parent="1" source="formula" target="out_pass"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_form_iter" style="${edgeStyle(C.brainstorm)}" edge="1" parent="1" source="formula" target="out_iter"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_form_force" style="${edgeStyle(C.evaluator)}" edge="1" parent="1" source="formula" target="out_force"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Recorder
  cells += `    <mxCell id="recorder" value="patent-path-recorder&#10;.brainstorm/nodes/round-2.json + 创新点快照" style="${agentStyle(C.evaluator)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="450" y="710" width="500" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_mod_rec" value="强制落盘" style="${feedbackEdgeStyle()}" edge="1" parent="1" source="formula" target="recorder"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  return cells;
}

// ----------------------------------------------------------------------------
// Diagram 4: QA Argue 闭环 — reviewer ↔ responder
// ----------------------------------------------------------------------------

function diagram4QALoop() {
  let cells = "";

  cells += `    <mxCell id="title" value="QA Argue 闭环：reviewer 提问 ↔ responder 答复，2 轮无新问题退出" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;fontColor=${C.text};" vertex="1" parent="1"><mxGeometry x="100" y="40" width="1200" height="36" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="subtitle" value="DRAFT 后进入 QA_LOOP：多轮审查-答复循环，连续 2 轮无新增问题才放行至 FINAL_REVIEW" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontColor=#64748b;" vertex="1" parent="1"><mxGeometry x="100" y="76" width="1200" height="22" as="geometry" /></mxCell>\n`;

  // Archimedes
  cells += `    <mxCell id="arch" value="Archimedes (编排)" style="${agentStyle(C.orchestrator)}" vertex="1" parent="1"><mxGeometry x="600" y="120" width="200" height="40" as="geometry" /></mxCell>\n`;

  // DRAFT input
  cells += `    <mxCell id="draft" value="DRAFT 产出&#10;MAIN.md 初稿" style="${stageStyle(C.draft)}" vertex="1" parent="1"><mxGeometry x="80" y="125" width="160" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_draft_arch" style="${edgeStyle(C.draft)}" edge="1" parent="1" source="draft" target="arch"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Reviewer (left)
  cells += `    <mxCell id="reviewer" value="patent-disclosure-reviewer&#10;&#10;审查者（挑刺）&#10;· 法律合规性&#10;· 撰写质量&#10;· 技术清楚性&#10;· 支持性&#10;· 落盘 qa_round{r}_*.md" style="${agentStyle(C.reviewer)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="100" y="240" width="320" height="150" as="geometry" /></mxCell>\n`;

  // Responder (right)
  cells += `    <mxCell id="responder" value="patent-technical-responder&#10;&#10;答复者（修订）&#10;· 逐条技术答复&#10;· 指定 MAIN.md 补丁落点&#10;· 补强技术细节&#10;· 落盘 argue_round{r}_*.md" style="${agentStyle(C.responder)}align=left;spacingLeft=14;" vertex="1" parent="1"><mxGeometry x="980" y="240" width="320" height="150" as="geometry" /></mxCell>\n`;

  // Loop arrow reviewer -> responder -> reviewer
  cells += `    <mxCell id="e_rev_resp" value="问题清单&#10;issueCount 个" style="${attackEdgeStyle()}exitX=1;exitY=0.25;exitDx=0;exitDy=0;entryX=0;entryY=0.25;entryDx=0;entryDy=0;" edge="1" parent="1" source="reviewer" target="responder"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="600" y="278" /><mxPoint x="600" y="278" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="e_resp_rev" value="修订 + 补丁&#10;回写 MAIN.md" style="${feedbackEdgeStyle()}exitX=0;exitY=0.75;exitDx=0;exitDy=0;entryX=1;entryY=0.75;entryDx=0;entryDy=0;" edge="1" parent="1" source="responder" target="reviewer"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="800" y="353" /><mxPoint x="800" y="353" /></Array></mxGeometry></mxCell>\n`;

  // Archimedes dispatch
  cells += `    <mxCell id="e_arch_rev" style="${edgeStyle(C.orchestrator)}" edge="1" parent="1" source="arch" target="reviewer"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_arch_resp" style="${edgeStyle(C.orchestrator)}" edge="1" parent="1" source="arch" target="responder"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Loop counter in the middle
  cells += `    <mxCell id="loop_counter" value="QA 轮次计数&#10;&#10;round ≤ 6 (上限)&#10;cleanRounds = 连续无新问题轮数&#10;&#10;退出条件：&#10;cleanRounds ≥ 2" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=${C.qa};fontColor=${C.text};fontSize=12;align=left;spacingLeft=16;shadow=1;" vertex="1" parent="1"><mxGeometry x="540" y="260" width="320" height="110" as="geometry" /></mxCell>\n`;

  // Round-by-round state
  cells += `    <mxCell id="round_title" value="轮次演进" style="${noteStyle(C.text)}fontStyle=1;fontSize=13;" vertex="1" parent="1"><mxGeometry x="100" y="430" width="120" height="22" as="geometry" /></mxCell>\n`;

  const rounds = [
    { x: 100,  r: "R1", issues: "5 个", clean: 0, color: C.qa,        pass: false },
    { x: 280,  r: "R2", issues: "3 个", clean: 0, color: C.qa,        pass: false },
    { x: 460,  r: "R3", issues: "1 个", clean: 0, color: C.qa,        pass: false },
    { x: 640,  r: "R4", issues: "0 个", clean: 1, color: C.brainstorm, pass: false },
    { x: 820,  r: "R5", issues: "0 个", clean: 2, color: C.done,       pass: true  },
  ];
  for (const r of rounds) {
    const bg = r.pass ? C.done : r.color;
    const label = `${r.r}&#10;issues: ${r.issues}&#10;clean: ${r.clean}`;
    cells += `    <mxCell id="r_${r.r}" value="${label}" style="${stageStyle(bg)}" vertex="1" parent="1"><mxGeometry x="${r.x}" y="460" width="160" height="60" as="geometry" /></mxCell>\n`;
  }
  for (let i = 0; i < rounds.length - 1; i++) {
    cells += `    <mxCell id="e_r_${i}" style="${edgeStyle(C.edge)}" edge="1" parent="1" source="r_${rounds[i].r}" target="r_${rounds[i+1].r}"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  }

  // Exit gate
  cells += `    <mxCell id="exit_gate" value="cleanRounds ≥ 2 ?&#10;退出 QA_LOOP" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=${C.done};fontColor=${C.text};fontSize=12;shadow=1;" vertex="1" parent="1"><mxGeometry x="1020" y="455" width="180" height="70" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_r5_exit" style="${edgeStyle(C.done)}" edge="1" parent="1" source="r_R5" target="exit_gate"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Outputs
  cells += `    <mxCell id="out_final" value="FINAL_REVIEW&#10;→ 最终润色" style="${stageStyle(C.done)}" vertex="1" parent="1"><mxGeometry x="1020" y="570" width="180" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="out_redraft" value="回 DRAFT&#10;重大问题重写" style="${stageStyle(C.draft)}" vertex="1" parent="1"><mxGeometry x="600" y="570" width="180" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_exit_final" value="YES" style="${edgeStyle(C.done)}" edge="1" parent="1" source="exit_gate" target="out_final"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_exit_redraft" value="重大问题&#10;NO" style="${feedbackEdgeStyle()}exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;" edge="1" parent="1" source="exit_gate" target="out_redraft"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="950" y="490" /><mxPoint x="950" y="595" /></Array></mxGeometry></mxCell>\n`;

  // Adversarial examiner also joins argue
  cells += `    <mxCell id="adv" value="patent-adversarial-examiner&#10;argue 阶段也参与：无效视角攻击" style="${agentStyle(C.attacker)}align=left;spacingLeft=14;fontSize=11;" vertex="1" parent="1"><mxGeometry x="100" y="660" width="380" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_adv_rev" value="补充质疑" style="${attackEdgeStyle()}" edge="1" parent="1" source="adv" target="reviewer"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  return cells;
}

// ----------------------------------------------------------------------------
// Diagram 5: 决策路径 DAG — branch / restore
// ----------------------------------------------------------------------------

function diagram5PathDAG() {
  let cells = "";

  cells += `    <mxCell id="title" value="决策路径 DAG：回溯、分支探索、创新点恢复" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;fontColor=${C.text};" vertex="1" parent="1"><mxGeometry x="100" y="30" width="1200" height="36" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="subtitle" value=".brainstorm/ 持久化 DAG：每个节点是一轮头脑风暴快照，边记录演化关系，支持 fork 分支与废弃创新点恢复" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontColor=#64748b;" vertex="1" parent="1"><mxGeometry x="100" y="66" width="1200" height="22" as="geometry" /></mxCell>\n`;

  // Main path nodes
  const mainNodes = [
    { id: "n1", x: 80,   y: 160, w: 140, h: 70, label: "Round 1", inn: "INN-001\nINN-002\nINN-003", color: C.brainstorm },
    { id: "n2", x: 280,  y: 160, w: 140, h: 70, label: "Round 2", inn: "INN-004 (refined)\nINN-005 (merged)", color: C.brainstorm },
    { id: "n3", x: 480,  y: 160, w: 140, h: 70, label: "Round 3", inn: "INN-006 ✓\n综合 8.8", color: C.done },
  ];
  for (const n of mainNodes) {
    const lbl = `${n.label}&#10;———&#10;${n.inn.replace(/\n/g, "&#10;")}`;
    cells += `    <mxCell id="${n.id}" value="${lbl}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${n.color};strokeColor=${n.color};fontColor=#ffffff;fontSize=11;arcSize=12;shadow=1;align=center;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry" /></mxCell>\n`;
  }
  // Main path edges (refine)
  cells += `    <mxCell id="e_n1_n2" value="refine" style="${edgeStyle(C.edge)}" edge="1" parent="1" source="n1" target="n2"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_n2_n3" value="refine" style="${edgeStyle(C.edge)}" edge="1" parent="1" source="n2" target="n3"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Final decision
  cells += `    <mxCell id="final" value="PASS_TO_DRAFT&#10;selected: INN-006" style="${stageStyle(C.done)}" vertex="1" parent="1"><mxGeometry x="680" y="170" width="180" height="50" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_n3_final" style="${edgeStyle(C.done)}" edge="1" parent="1" source="n3" target="final"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Branch from Round 2
  cells += `    <mxCell id="branch1" value="branch-1&#10;（探索 INN-005&#10;硬件实现）" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${C.diagram};strokeColor=${C.diagram};fontColor=#ffffff;fontSize=11;arcSize=20;dashed=1;shadow=1;" vertex="1" parent="1"><mxGeometry x="280" y="320" width="160" height="70" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="branch1_b" value="branch-1/Round 2'&#10;INN-005-hw" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${C.diagram};strokeColor=${C.diagram};fontColor=#ffffff;fontSize=11;arcSize=20;dashed=1;shadow=1;" vertex="1" parent="1"><mxGeometry x="280" y="420" width="160" height="60" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_n2_b1" value="path branch&#10;--from-node round-2" style="${edgeStyle(C.diagram, true, 2)}dashed=1;" edge="1" parent="1" source="n2" target="branch1"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_b1_b1b" style="${edgeStyle(C.diagram, true, 1.5)}dashed=1;" edge="1" parent="1" source="branch1" target="branch1_b"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Abandoned innovation from Round 1
  cells += `    <mxCell id="abandoned" value="INN-003&#10;[REJECTED]&#10;lacks novelty" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fecaca;strokeColor=${C.attacker};fontColor=${C.text};fontSize=11;arcSize=12;dashed=1;fontStyle=2;" vertex="1" parent="1"><mxGeometry x="80" y="320" width="140" height="70" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_n1_ab" value="abandon" style="${attackEdgeStyle()}" edge="1" parent="1" source="n1" target="abandoned"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Restore arrow: abandoned -> current round (Round 3)
  cells += `    <mxCell id="restore_target" value="Round 3' (恢复后)&#10;INN-003' + INN-006" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${C.evaluator};strokeColor=${C.evaluator};fontColor=#ffffff;fontSize=11;arcSize=12;shadow=1;" vertex="1" parent="1"><mxGeometry x="480" y="320" width="160" height="70" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="e_ab_restore" value="path restore&#10;--node round-1 --innovation INN-003" style="${feedbackEdgeStyle()}strokeWidth=2.5;strokeColor=${C.evaluator};fontColor=${C.evaluator};exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" parent="1" source="abandoned" target="restore_target"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="260" y="355" /><mxPoint x="260" y="355" /></Array></mxGeometry></mxCell>\n`;
  cells += `    <mxCell id="e_restore_n3" value="差异化后&#10;重新评估" style="${edgeStyle(C.evaluator)}" edge="1" parent="1" source="restore_target" target="n3"><mxGeometry relative="1" as="geometry" /></mxCell>\n`;

  // Storage structure on the right
  cells += `    <mxCell id="storage_title" value=".brainstorm/ 目录结构" style="${noteStyle(C.text)}fontStyle=1;fontSize=13;" vertex="1" parent="1"><mxGeometry x="900" y="120" width="220" height="22" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="storage" value=".brainstorm/&#10;├── path.json          # 元数据 + edges + currentNodeId&#10;├── nodes/&#10;│   ├── round-1.json   # 评分/创新点/决策快照&#10;│   ├── round-2.json&#10;│   └── round-3.json&#10;├── snapshots/&#10;│   └── round-{n}-innovations.json&#10;└── branches/&#10;    └── {branchId}/     # 分支节点副本" style="text;html=1;strokeColor=#cbd5e1;fillColor=${C.bg};align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontColor=${C.text};fontSize=11;spacingLeft=12;spacingTop=8;fontFamily=Consolas,monospace;" vertex="1" parent="1"><mxGeometry x="900" y="150" width="400" height="200" as="geometry" /></mxCell>\n`;

  // Operations legend
  cells += `    <mxCell id="ops_title" value="路径操作命令" style="${noteStyle(C.text)}fontStyle=1;fontSize=13;" vertex="1" parent="1"><mxGeometry x="900" y="380" width="200" height="22" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="ops" value="oh-my-patent path overview        # 全景&#10;oh-my-patent path node round-2       # 节点详情&#10;oh-my-patent path branch --from-node round-2 --reason &quot;...&quot;&#10;oh-my-patent path restore --node round-1 --innovation INN-003&#10;oh-my-patent path visualize --mode dashboard" style="text;html=1;strokeColor=#cbd5e1;fillColor=${C.bg};align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontColor=${C.text};fontSize=11;spacingLeft=12;spacingTop=8;fontFamily=Consolas,monospace;" vertex="1" parent="1"><mxGeometry x="900" y="410" width="400" height="120" as="geometry" /></mxCell>\n`;

  // Legend
  cells += `    <mxCell id="leg1" value="主路径 (refine)" style="${stageStyle(C.brainstorm)}fontSize=10;" vertex="1" parent="1"><mxGeometry x="80" y="560" width="130" height="34" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="leg2" value="分支 (branch)" style="${stageStyle(C.diagram)}fontSize=10;dashed=1;" vertex="1" parent="1"><mxGeometry x="230" y="560" width="130" height="34" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="leg3" value="废弃 (abandon)" style="${stageStyle(C.attacker)}fontSize=10;dashed=1;" vertex="1" parent="1"><mxGeometry x="380" y="560" width="130" height="34" as="geometry" /></mxCell>\n`;
  cells += `    <mxCell id="leg4" value="恢复 (restore)" style="${stageStyle(C.evaluator)}fontSize=10;" vertex="1" parent="1"><mxGeometry x="530" y="560" width="130" height="34" as="geometry" /></mxCell>\n`;

  return cells;
}

// ============================================================================
// Main
// ============================================================================

const diagrams = [
  { id: "01-orchestration",   title: "总流程编排：Archimedes 主编排器 + 10 阶段状态机", build: diagram1Orchestration },
  { id: "02-adversarial",     title: "R1 对抗式头脑风暴：architect vs examiner",       build: diagram2Adversarial },
  { id: "03-parallel-eval",   title: "R2 多维评估：security + compliance + evaluator",  build: diagram3ParallelEval },
  { id: "04-qa-loop",         title: "QA Argue 闭环：reviewer ↔ responder",            build: diagram4QALoop },
  { id: "05-path-dag",        title: "决策路径 DAG：branch / restore",                  build: diagram5PathDAG },
];

function wrapMxGraph(cellsXml, w = 1400, h = 900) {
  return `<mxGraphModel dx="${w}" dy="${h}" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${w}" pageHeight="${h}" math="0" shadow="0">\n  <root>\n    <mxCell id="0" />\n    <mxCell id="1" parent="0" />\n${cellsXml}\n  </root>\n</mxGraphModel>`;
}

function generateAll(open = false) {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const d of diagrams) {
    const xml = d.build();
    if (!xml) { console.warn(`[skip] ${d.id} — builder empty`); continue; }
    const wrapped = wrapMxGraph(xml);
    const filePath = join(OUT_DIR, `${d.id}.drawio`);
    writeFileSync(filePath, wrapped, "utf-8");
    const url = generateDrawioUrl(wrapped);
    console.log(`\n=== ${d.title} ===`);
    console.log(`file: ${filePath}`);
    console.log(`url:  ${url}`);
    if (open) openBrowser(url);
  }
}

const openFlag = process.argv.includes("--open");
generateAll(openFlag);
