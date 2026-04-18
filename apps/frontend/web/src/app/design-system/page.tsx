export const metadata = {
  title: "Flux — Design System",
};

const semanticColors = [
  { name: "background", desc: "앱 기본 배경" },
  { name: "foreground", desc: "본문 텍스트" },
  { name: "muted", desc: "약화된 배경" },
  { name: "muted-foreground", desc: "약화된 텍스트" },
  { name: "border", desc: "구분선" },
  { name: "ring", desc: "포커스 링" },
  { name: "primary", desc: "주요 액션" },
  { name: "primary-foreground", desc: "primary 위 텍스트" },
  { name: "secondary", desc: "보조 배경" },
  { name: "secondary-foreground", desc: "secondary 위 텍스트" },
  { name: "accent", desc: "강조 배경" },
  { name: "accent-foreground", desc: "accent 위 텍스트" },
  { name: "destructive", desc: "위험·삭제" },
  { name: "warning", desc: "경고" },
  { name: "success", desc: "성공" },
  { name: "card", desc: "카드 배경" },
  { name: "popover", desc: "팝오버 배경" },
  { name: "sidebar", desc: "사이드바 배경" },
];

const spacingScale = [
  "0",
  "0-5",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "8",
  "12",
];

const radiusScale = ["sm", "md", "lg", "xl", "full"];

const textScale = [
  { name: "xs", label: "11px" },
  { name: "sm", label: "12px" },
  { name: "md", label: "14px (본문)" },
  { name: "lg", label: "16px" },
  { name: "xl", label: "20px" },
];

const componentHeights = [
  { token: "--tabbar-height", label: "Tab Bar" },
  { token: "--toolbar-height", label: "Toolbar" },
  { token: "--statusbar-height", label: "Status Bar" },
  { token: "--button-height", label: "Button" },
  { token: "--input-height", label: "Input" },
  { token: "--tree-item-height", label: "Tree Item" },
  { token: "--chip-height", label: "Chip" },
];

const iconSizes = [
  { token: "--icon-sm", label: "Small (16px)" },
  { token: "--icon-md", label: "Medium (20px)" },
  { token: "--icon-lg", label: "Large (24px)" },
];

const motionScale = [
  { name: "instant", label: "0ms" },
  { name: "fast", label: "100ms" },
  { name: "normal", label: "150ms" },
  { name: "slow", label: "200ms" },
];

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: "var(--spacing-12)",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "var(--spacing-8)",
      }}
    >
      <h2
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--font-semibold)",
          marginBottom: "var(--spacing-2)",
        }}
      >
        {title}
      </h2>
      {desc ? (
        <p
          style={{
            color: "var(--muted-foreground)",
            fontSize: "var(--text-sm)",
            marginBottom: "var(--spacing-6)",
          }}
        >
          {desc}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "var(--spacing-8)",
      }}
    >
      <header style={{ marginBottom: "var(--spacing-12)" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "var(--font-semibold)",
            marginBottom: "var(--spacing-2)",
          }}
        >
          Flux Design System
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          globals.css 토큰이 실제로 어떻게 보이는지 확인하는 페이지.
          docs/design/디자인.md에서 결정된 값이 여기 반영된다.
        </p>
      </header>

      <Section
        title="Color / Semantic"
        desc="역할 기반 색상. 라이트 모드 기준. .dark 클래스가 body에 붙으면 모든 토큰이 다크 값으로 바뀐다."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "var(--spacing-3)",
          }}
        >
          {semanticColors.map((c) => (
            <div
              key={c.name}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "64px",
                  background: `var(--${c.name})`,
                  borderBottom: "1px solid var(--border)",
                }}
              />
              <div
                style={{
                  padding: "var(--spacing-3)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)" }}>
                  --{c.name}
                </div>
                <div
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "var(--text-xs)",
                    marginTop: "var(--spacing-1)",
                  }}
                >
                  {c.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Typography"
        desc="본문은 --text-md (14px). 팔칠칠엠 일상체 → Plus Jakarta Sans → system-ui 폴백."
      >
        {textScale.map((t) => (
          <div
            key={t.name}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "var(--spacing-4)",
              padding: "var(--spacing-3) 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)",
                minWidth: "120px",
              }}
            >
              --text-{t.name}
            </code>
            <span style={{ fontSize: `var(--text-${t.name})` }}>
              글이 빠르게 흐른다 — Flux ({t.label})
            </span>
          </div>
        ))}
        <div
          style={{
            marginTop: "var(--spacing-6)",
            padding: "var(--spacing-4)",
            background: "var(--muted)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
          }}
        >
          const mono = &quot;JetBrains Mono&quot;; // --font-mono
        </div>
      </Section>

      <Section
        title="Spacing"
        desc="4px 기반 배수. 카드 gap 12px, 여백은 8/16/24 위주."
      >
        {spacingScale.map((s) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-4)",
              padding: "var(--spacing-2) 0",
            }}
          >
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)",
                minWidth: "100px",
              }}
            >
              --spacing-{s}
            </code>
            <div
              style={{
                height: "16px",
                width: `var(--spacing-${s})`,
                background: "var(--primary)",
                borderRadius: "var(--radius-sm)",
              }}
            />
          </div>
        ))}
      </Section>

      <Section title="Radius" desc="카드 xl, 칩 full, 기본 md.">
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-4)",
            flexWrap: "wrap",
          }}
        >
          {radiusScale.map((r) => (
            <div
              key={r}
              style={{
                width: "96px",
                height: "96px",
                background: "var(--accent)",
                borderRadius: `var(--radius-${r})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
              }}
            >
              {r}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Component Heights"
        desc="Compact density. UI 요소의 기본 높이."
      >
        {componentHeights.map((c) => (
          <div
            key={c.token}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-4)",
              padding: "var(--spacing-2) 0",
            }}
          >
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)",
                minWidth: "200px",
              }}
            >
              {c.token}
            </code>
            <div
              style={{
                height: `var(${c.token})`,
                width: "200px",
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                padding: "0 var(--spacing-3)",
                fontSize: "var(--text-sm)",
              }}
            >
              {c.label}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Icon Sizes">
        <div style={{ display: "flex", gap: "var(--spacing-6)" }}>
          {iconSizes.map((i) => (
            <div
              key={i.token}
              style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}
            >
              <div
                style={{
                  width: `var(${i.token})`,
                  height: `var(${i.token})`,
                  background: "var(--foreground)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <span style={{ fontSize: "var(--text-sm)" }}>{i.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Motion" desc="150ms 이하 유지. reduce-motion이면 전부 0ms.">
        {motionScale.map((m) => (
          <div
            key={m.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-4)",
              padding: "var(--spacing-2) 0",
            }}
          >
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)",
                minWidth: "180px",
              }}
            >
              --duration-{m.name}
            </code>
            <span style={{ fontSize: "var(--text-sm)" }}>{m.label}</span>
          </div>
        ))}
      </Section>

      <Section title="Buttons (샘플)">
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-3)",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              height: "var(--button-height)",
              padding: "0 var(--spacing-4)",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-medium)",
              cursor: "pointer",
            }}
          >
            Primary
          </button>
          <button
            style={{
              height: "var(--button-height)",
              padding: "0 var(--spacing-4)",
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-medium)",
              cursor: "pointer",
            }}
          >
            Secondary
          </button>
          <button
            style={{
              height: "var(--button-height)",
              padding: "0 var(--spacing-4)",
              background: "transparent",
              color: "var(--destructive)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--destructive)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-medium)",
              cursor: "pointer",
            }}
          >
            Destructive
          </button>
          <button
            style={{
              height: "var(--button-height)",
              padding: "0 var(--spacing-4)",
              background: "transparent",
              color: "var(--foreground)",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
            }}
          >
            Ghost
          </button>
        </div>
      </Section>

      <Section title="Card (샘플)">
        <div
          style={{
            padding: "var(--card-padding)",
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--card-radius)",
            boxShadow: "var(--card-shadow)",
            maxWidth: "360px",
          }}
        >
          <div
            style={{
              height: "160px",
              background: "var(--muted)",
              borderRadius: "var(--radius-lg)",
              marginBottom: "var(--spacing-3)",
            }}
          />
          <div style={{ padding: "0 var(--spacing-2) var(--spacing-2)" }}>
            <div
              style={{
                fontSize: "var(--text-md)",
                fontWeight: "var(--font-medium)",
                marginBottom: "var(--spacing-1)",
              }}
            >
              아이템 제목
            </div>
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--muted-foreground)",
              }}
            >
              example.com · AI 요약 한 줄
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
