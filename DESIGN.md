---
version: alpha
name: Get It Done at Work
description: Dark, executive-grade matching platform for Korean startups entering the US market. Lime accent, MBA gravitas.

colors:
  primary: "#d4f000"
  background: "#0a0a0a"
  surface-dark: "#1c1d1f"
  card: "#1f2122"
  border: "#2a2c2d"
  accent: "#d4f000"
  blue: "#5b9bd5"
  text: "#e0e0e0"
  dim: "#7a7a7a"
  success: "#22c55e"
  warning: "#f59e0b"
  danger: "#ef4444"
  gold: "#eab308"

typography:
  hero:
    fontFamily: Instrument Sans
    fontSize: 96px
    fontWeight: 700
    lineHeight: 1.05
  h1:
    fontFamily: Instrument Sans
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.1
  h2:
    fontFamily: Instrument Sans
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
  h3:
    fontFamily: Instrument Sans
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
  h4:
    fontFamily: Instrument Sans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    lineHeight: 1.65
  body-md:
    fontFamily: Inter
    fontSize: 16px
    lineHeight: 1.65
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    lineHeight: 1.5
  caption:
    fontFamily: Inter
    fontSize: 13px
    lineHeight: 1.4
  label-caps:
    fontFamily: Instrument Sans
    fontSize: 11px
    fontWeight: 600
    letterSpacing: 0.08em

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.dim}"
    border: "{colors.border}"
    rounded: "{rounded.md}"
  button-danger:
    backgroundColor: "{colors.background}"
    textColor: "{colors.danger}"
    border: "{colors.danger}"
    rounded: "{rounded.md}"
  card-default:
    backgroundColor: "{colors.card}"
    border: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  badge-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
    rounded: "{rounded.full}"
  badge-info:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.background}"
    rounded: "{rounded.full}"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.background}"
    rounded: "{rounded.full}"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.background}"
    rounded: "{rounded.full}"
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.background}"
    rounded: "{rounded.full}"
---

## Overview

Get It Done at Work는 한국 스타트업과 미국 시장 전문가(Enabler)를 1:1 매칭하는 실행 중심 플랫폼입니다. 디자인은 **미국 비즈니스 클래스의 무게감 + 한국 스타트업의 야심**을 다크 베이스 + 라임 액센트로 표현합니다.

핵심 키워드: **Executive grade, executable confidence, no fluff.**

## Design System Source

모든 토큰은 `src/app/globals.css`의 `@theme` 블록에 `oklch()` 값으로 정의됩니다. 컴포넌트는 반드시 `var(--color-*)`, `var(--radius-*)`, `var(--shadow-*)` 형태의 CSS 변수를 참조합니다. 하드코딩된 hex/oklch 값 직접 사용 금지.

DESIGN.md의 hex 색상 값은 토큰의 sRGB 근사값입니다. 실제 구현에서는 `globals.css`의 oklch 값이 우선합니다.

## Colors

### Background Hierarchy

세 가지 다크 톤으로 레이어 깊이를 표현합니다:

| 토큰 | CSS 변수 | 역할 |
|------|----------|------|
| background | `--color-black` | 페이지 베이스. 가장 어두운 바닥 |
| surface-dark | `--color-dark` | 살짝 들린 표면. nav, sidebar |
| card | `--color-card` | 콘텐츠 컨테이너. 카드 배경 |
| border | `--color-border` | 분리선. 1px border |

> **Warning**: `var(--color-surface)`는 oklch 96% lightness로 거의 흰색입니다. 카드/컨테이너 배경으로 사용 금지. 그라데이션 오버레이 전용.

### Accent (Primary)

- **primary / accent (`--color-accent`)**: 라임 옐로우 `#d4f000`. **유일한 primary action 컬러.** 모든 CTA 버튼, 활성 상태, 강조 키워드.
- **accentDim**: `rgba(#d4f000, 0.1)` — badge 배경, hover 영역 틴트.

> Rule: accent는 한 화면에 1~2개 포인트만. 흩뿌리지 않을 것.

### Blue

`--color-blue`: 정보성 표시 전용 (info badge, 크레딧·세션 수 등 secondary 수치). Primary action에 사용 금지.

### Semantic Colors

| 토큰 | CSS 변수 | 용도 |
|------|----------|------|
| success | `--color-green` | 성공 / 확정 / Verified |
| warning | `--color-amber` | 대기 / 주의 / Pending |
| danger | `--color-red` | 실패 / 경고 / Danger |
| gold | `--color-gold` | 프리미엄 / 등급 / Top Rated |

### Text

- `text` (`--color-text`): 본문 오프화이트 `#e0e0e0`. Pure white(`#fff`) 금지.
- `dim` (`--color-dim`): 캡션, 메타데이터, 보조 정보 `#7a7a7a`.

## Typography

- **Hero**: Instrument Sans 700, `clamp(56px, 8vw, 96px)`, line-height 1.05. Brand statement 전용.
- **H1~H4**: Instrument Sans, 섹션 및 카드 헤더.
- **body**: Inter, 16–17px, line-height 1.65.
- **label-caps**: Instrument Sans 600, 11px, letter-spacing 0.08em, uppercase. 카테고리 태그.

> Rule: heading = `var(--font-display)` (Instrument Sans), body = `var(--font-body)` (Inter). 절대 혼용 금지.

## Spacing

8px 기반 스케일. 섹션 사이 `section(64px)`. 카드 내부 `lg(24px)`. 요소 간 `md(16px)` 또는 `lg(24px)`.

임의의 픽셀값(40px, 28px 등) 사용 시 근접한 토큰으로 교체합니다.

## Components

### Button

- **Primary**: `var(--color-accent)` 배경 + `var(--color-black)` 텍스트. 모든 primary CTA. `font-family: var(--font-display)`, font-weight 600.
- **Secondary**: 투명 배경 + `var(--color-border)` 테두리 + `var(--color-dim)` 텍스트.
- **Ghost**: 투명 배경/테두리 + `var(--color-dim)` 텍스트.
- **Danger**: 투명 배경 + `var(--color-red)` 테두리/텍스트.
- 최소 높이 44px (모바일 터치 타겟).
- hover: `opacity: 0.85` (transition 150ms).
- focus: `box-shadow: 0 0 0 2px var(--color-black), 0 0 0 4px var(--color-accent)`.

### Card

- `var(--color-card)` 배경 + `var(--color-border)` 1px 테두리 + `var(--radius-lg)` radius.
- 내부 padding `lg(24px)`. 카드 간격 `md(16px)` 또는 `lg(24px)`.

### Badge

- 색상별 semantic variant 사용 (`success`/`warning`/`danger`/`info`/`accent`/`neutral`).
- `var(--font-body)` + `var(--radius-full)`.
- 실제 구현에서 배경은 반투명(10% opacity) — badge가 배경을 가리지 않게.

## Anti-Patterns

| 금지 | 대안 |
|------|------|
| 화이트/라이트 카드 배경 | `var(--color-card)` |
| `var(--color-surface)` 카드 배경 | `var(--color-card)` |
| 보라/인디고 그라데이션 | accent(라임) + border 그리드 패턴 |
| 3-column icon-in-colored-circle 그리드 | 텍스트 중심 또는 가로 레이아웃 |
| `system-ui` / `Arial` / `Roboto` 폰트 | Instrument Sans + Inter |
| 이모지 데코레이션 | 없음 또는 SVG 아이콘 |
| 모든 텍스트 중앙 정렬 | 좌정렬 기본, CTA 섹션만 중앙 |
| 임의 픽셀값 (40px, 28px 등) | spacing 토큰 사용 |
| 하드코딩된 oklch/hex 값 | CSS 변수 참조 |

## Motion

- entry: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo), 200–400ms
- exit: `cubic-bezier(0.7, 0, 0.84, 0)` (ease-in), 150ms
- `transform` / `opacity` 만 사용. layout property(width, height, margin) 금지
- `prefers-reduced-motion` 존중
- 장식적 반복 모션 금지
