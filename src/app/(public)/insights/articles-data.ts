// ─── Section & Article Types ──────────────────────────────────────────────────

export type Section =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "blockquote"; text: string; attribution?: string }
  | { type: "stat"; label: string; value: string; hint?: string };

export interface Author {
  name: string;
  title: string;
  avatar: string;
}

export type Category = "전체" | "SaaS" | "Fintech" | "AI/DeepTech" | "E-commerce" | "전략";

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: "SaaS" | "Fintech" | "AI/DeepTech" | "E-commerce" | "전략";
  tags: string[];
  readTime: number;
  date: string;
  author: Author;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  featured?: boolean;
  body: Section[];
  tldr?: string[];
}

// ─── Featured Article ─────────────────────────────────────────────────────────

export const FEATURED_ARTICLE: Article = {
  id: 0,
  slug: "gtm-strategy-first-customer",
  title: "미국 시장 진출, 첫 번째 고객을 만들기까지: GTM 전략의 모든 것",
  excerpt:
    "많은 한국 스타트업이 훌륭한 제품을 가지고도 미국 시장에서 첫 번째 고객을 확보하는 데 실패합니다. 문제는 제품이 아닙니다. GTM 전략의 부재입니다. Wharton MBA 출신 Market Enabler가 직접 경험한 실패와 성공 사례를 바탕으로, 한국 스타트업이 미국에서 첫 계약을 따내기까지의 실전 전략을 공유합니다.",
  category: "전략",
  tags: ["GTM", "미국진출", "영업전략"],
  readTime: 12,
  date: "2026. 03. 20",
  author: {
    name: "Sarah Chen",
    title: "Wharton MBA · GTM Strategy",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
  },
  gradientFrom: "oklch(0.22 0.04 280)",
  gradientTo: "oklch(0.14 0.02 280)",
  accentColor: "var(--color-accent)",
  featured: true,
  tldr: [
    "한국에서 검증된 PMF가 미국에서 다시 깨지는 가장 큰 이유는 ICP 재정의 실패다.",
    "2026년 AI outbound 툴의 보급으로 cold outreach 비용이 90% 떨어졌지만 응답률도 같이 떨어졌다. 진짜 무기는 '따뜻한 인트로'다.",
    "POC 시작 전 반드시 Champion과 Economic Buyer를 분리해 파악해야 한다.",
    "첫 계약은 꼭 큰 로고일 필요 없다. 레퍼런스가 될 수 있는 적합한 고객이 먼저다.",
  ],
  body: [
    {
      type: "p",
      text: "2025년 초, 제가 돕기 시작한 한국 HR SaaS 스타트업 H사는 국내에서 연간 반복 매출(ARR) 약 50억 원을 달성한 탄탄한 제품을 가지고 있었습니다. 팀도 강했고, 기술도 충분했습니다. 하지만 미국에 법인을 설립한 지 6개월이 지나도록 첫 유료 미팅조차 잡지 못하고 있었습니다. 문제는 제품이 아니었습니다.",
    },
    {
      type: "h2",
      text: "한국 PMF가 미국에서 다시 깨지는 이유",
    },
    {
      type: "p",
      text: "H사의 가장 큰 착각은 '한국에서 통했으니 미국에서도 통한다'는 가정이었습니다. 한국 시장에서 ICP(이상적 고객 프로파일)는 '직원 수 300~1000명, 제조·물류 업종, IT 담당자 1명'이었습니다. 이를 그대로 미국에 적용하자 문이 열리지 않았습니다. 미국 같은 규모의 회사라면 이미 Workday나 BambooHR를 쓰고 있고, 교체 비용(switching cost)이 극히 높았기 때문입니다.",
    },
    {
      type: "blockquote",
      text: "미국 ICP는 '한국 ICP의 미국 버전'이 아닙니다. 완전히 새로운 시장 조사로 처음부터 정의해야 합니다.",
      attribution: "Sarah Chen",
    },
    {
      type: "h2",
      text: "ICP 재정의: 어디서 시작할 것인가",
    },
    {
      type: "p",
      text: "미국 ICP를 새로 정의할 때 저는 세 가지 질문을 던집니다. 첫째, '누가 가장 빨리 가치를 느끼는가(time-to-value가 가장 짧은 세그먼트는 어디인가)?' 둘째, '누가 현재 가장 불편한가(현 솔루션에 가장 불만이 높은 세그먼트는?)?' 셋째, '레퍼런스를 줄 수 있는 고객인가?' H사의 경우, 분석 결과 미국 내 한국계 혹은 아시아계 창업 SaaS 스타트업(직원 20~80명)이 초기 ICP로 최적이었습니다. 그들은 한국 팀과 협업하는 경험이 있어 도입 사이클이 짧았고, 성공 사례를 기꺼이 공유해 주었습니다.",
    },
    {
      type: "stat",
      label: "ICP 재정의 후 미팅 응답률 변화",
      value: "3.2% → 18%",
      hint: "H사, 2025년 3월~6월 cold outreach 캠페인 비교",
    },
    {
      type: "h2",
      text: "2026년 Outbound의 변화: AI가 바꾼 것과 바꾸지 못한 것",
    },
    {
      type: "p",
      text: "Apollo, Clay, Instantly 같은 AI 기반 outbound 자동화 툴이 보급되면서 개인화된 cold email을 1,000건 발송하는 비용이 거의 0에 수렴하게 됐습니다. 문제는 모두가 같은 툴을 쓰기 때문에 decision maker의 받은 편지함이 그 어느 때보다 빠르게 오염됐다는 점입니다. 2025년 기준 SaaS 분야 cold email 평균 응답률은 0.8%까지 떨어졌습니다. 반면 '따뜻한 인트로(warm intro)'의 가치는 반대로 치솟았습니다.",
    },
    {
      type: "ul",
      items: [
        "LinkedIn 1촌 인트로: 응답률 약 35~60% (산업별 편차 큼)",
        "공통 투자자/엑셀러레이터 네트워크 인트로: 응답률 약 40~70%",
        "커뮤니티 기반 접근 (Slack 그룹, Discord 커뮤니티): 응답률 약 20~35%",
        "Cold email (AI 자동화): 응답률 0.5~2%",
      ],
    },
    {
      type: "h2",
      text: "Champion과 Economic Buyer를 분리하라",
    },
    {
      type: "p",
      text: "B2B 세일즈에서 가장 흔한 실수 중 하나는 처음 미팅을 잡아준 담당자(흔히 Director나 Manager급)를 '의사결정자'로 착각하는 것입니다. 이 사람은 Champion, 즉 내부 도입을 이끌어줄 수 있는 사람이지만, 실제 예산을 집행하는 Economic Buyer(VP, C-레벨)는 따로 있습니다. POC를 시작하기 전에 반드시 'Who controls the budget?'을 물어야 합니다. H사의 경우, 3개월 무료 POC를 진행했는데 Champion인 HR Director가 퇴사하면서 모든 것이 원점이 됐습니다.",
    },
    {
      type: "h2",
      text: "POC 설계: 성공을 미리 정의하라",
    },
    {
      type: "p",
      text: "POC(Proof of Concept)를 시작하기 전에 '성공의 정의'를 문서로 합의해야 합니다. '90일 후에 이 지표가 X% 개선되면 계약으로 진행한다'는 식의 Success Criteria를 POC 킥오프 미팅에서 양측이 서명한 문서로 남기는 것이 이상적입니다. 이 과정이 없으면 POC는 무한정 연장되거나, 계약 단계에서 '좀 더 지켜보자'는 말로 흐지부지됩니다.",
    },
    {
      type: "ol",
      items: [
        "POC 킥오프: Success Criteria 문서 서명 (담당자 + 의사결정자 동시 참여)",
        "2주차 체크인: 진행 상황 리뷰 및 장애 요인 제거",
        "4주차: 중간 결과 리포트 (데이터 기반, 1장 이내)",
        "8주차: 최종 결과 리포트 + 계약 논의 시작",
        "90일 이내: 계약 or No-go 결정 (이후 연장 불가 원칙)",
      ],
    },
    {
      type: "h2",
      text: "첫 계약: 큰 로고보다 좋은 레퍼런스",
    },
    {
      type: "p",
      text: "미국 진출 초기에 Fortune 500을 목표로 삼는 팀이 많습니다. 하지만 초기 스타트업에게 대형 엔터프라이즈 계약은 12~18개월의 영업 사이클과 막대한 legal·security 비용이 따릅니다. 첫 계약은 '레퍼런스가 될 수 있는 고객'이 먼저입니다. 실제로 공개 케이스 스터디를 써줄 수 있고, 비슷한 규모의 잠재 고객에게 레퍼런스 콜에 응해줄 의향이 있는 고객 3~5곳을 먼저 확보하십시오. 이것이 나머지 파이프라인을 열어주는 열쇠가 됩니다.",
    },
    {
      type: "blockquote",
      text: "첫 계약의 목적은 매출이 아닙니다. 다음 10개 계약의 문을 열어주는 레퍼런스를 확보하는 것입니다.",
      attribution: "Sarah Chen",
    },
    {
      type: "h2",
      text: "Actionable Takeaway",
    },
    {
      type: "ul",
      items: [
        "미국 ICP를 한국 ICP와 별개로 처음부터 정의하라. 세그먼트 3개를 선정하고 각 10개사에 outreach해 응답률을 비교하라.",
        "Warm intro 파이프라인을 먼저 구축하라. YC, 500 Startups, 한국계 투자자 네트워크를 적극 활용하라.",
        "POC 시작 전 Success Criteria를 문서로 합의하라. 90일 hard deadline을 반드시 포함시켜라.",
        "첫 세 곳의 고객은 '케이스 스터디 동의 여부'를 계약 조건에 포함시켜라.",
      ],
    },
  ],
};

// ─── Articles ─────────────────────────────────────────────────────────────────

export const ARTICLES: Article[] = [
  {
    id: 1,
    slug: "5-mistakes-korean-saas-us-market",
    title: "한국 SaaS 기업이 미국 시장에서 흔히 하는 5가지 실수",
    excerpt:
      "현지화 없는 가격 정책부터 잘못된 ICP 설정까지. 미국 B2B SaaS 시장에서 반복되는 치명적 실수들을 분석합니다.",
    category: "SaaS",
    tags: ["SaaS", "실수", "미국진출"],
    readTime: 8,
    date: "2026. 03. 18",
    author: {
      name: "Sarah Chen",
      title: "Wharton MBA · GTM Strategy",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.91 0.2 110 / 0.12)",
    gradientTo: "oklch(0.91 0.2 110 / 0.03)",
    accentColor: "var(--color-accent)",
    tldr: [
      "가격은 미국 경쟁사 기준으로 재설계해야 한다. 한국 가격 그대로 들고오면 'cheap & untrustworthy' 포지셔닝이 된다.",
      "PLG와 SLG는 동시에 잘 할 수 없다. 초기에는 하나를 선택하고 집중하라.",
      "SOC 2 Type II 없이 미국 엔터프라이즈 계약은 불가능하다. 최소 6개월 전에 시작하라.",
    ],
    body: [
      {
        type: "p",
        text: "지난 3년간 저는 미국 시장에 진출한 한국 B2B SaaS 스타트업 20여 곳을 직접 지원했습니다. 그 과정에서 회사마다 다른 제품과 팀을 가졌지만 놀랍도록 유사한 실수를 반복하는 패턴을 발견했습니다. 다섯 가지로 압축해 공유합니다.",
      },
      {
        type: "h3",
        text: "실수 1: 한국 가격을 그대로 들고 간다",
      },
      {
        type: "p",
        text: "한국에서 월 30만 원짜리 제품을 $200로 환산해 미국에 출시하는 팀이 많습니다. 미국 경쟁사들은 같은 카테고리에서 월 $500~$2,000를 받는데 말이죠. 미국 B2B 바이어는 가격이 낮으면 오히려 의심합니다. 'Why is this so cheap? What's missing?' 가격은 신뢰의 신호입니다. 미국 시장에서는 연간 계약(annual contract) 기준으로 경쟁사 대비 20~30% 저렴한 수준에서 출발하되, 월 구독만 제공하는 실수는 피하십시오. 미국 B2B SaaS의 60% 이상은 annual contract로 계약합니다.",
      },
      {
        type: "stat",
        label: "미국 B2B SaaS Annual Contract 비율",
        value: "63%",
        hint: "OpenView Partners, 2025 SaaS Benchmarks",
      },
      {
        type: "h3",
        text: "실수 2: 한국 ICP를 미국 ICP라고 착각한다",
      },
      {
        type: "p",
        text: "앞선 아티클에서도 언급했지만, 한국에서의 이상적 고객 프로파일이 미국에서는 완전히 다를 수 있습니다. 특히 산업 구조, 구매 의사결정 구조(centralized vs. decentralized), IT 스택 표준이 한국과 미국은 크게 다릅니다. 한국에서 중견기업 대상 IT 솔루션을 팔던 팀이 미국에서 같은 규모의 회사를 타겟했을 때, 이미 Salesforce·HubSpot·Workday 등으로 가득 찬 스택을 발견하고 진입 불가 상태를 맞닥뜨리는 경우가 빈번합니다.",
      },
      {
        type: "h3",
        text: "실수 3: PLG와 SLG를 동시에 하려 한다",
      },
      {
        type: "p",
        text: "PLG(Product-Led Growth)는 Slack, Figma처럼 제품 자체가 바이럴 루프를 만드는 전략이고, SLG(Sales-Led Growth)는 영업 팀이 직접 deal을 클로즈하는 전략입니다. 둘은 팀 구성, 제품 설계, 가격 모델, 성공 지표가 완전히 다릅니다. 초기 자원이 제한된 한국 스타트업이 둘 다 하려 하면 어느 쪽도 제대로 못 하고 소진됩니다. 제품이 셀프서비스로 가치를 전달할 수 있다면 PLG, 복잡한 구현이 필요하고 ACV(연간 계약 가치)가 $20,000 이상이라면 SLG로 먼저 집중하십시오.",
      },
      {
        type: "h3",
        text: "실수 4: 미국 시간대와 영업일을 무시한다",
      },
      {
        type: "p",
        text: "서울에서 미국 동부 시간대 고객을 대응하려면 한국 시간으로 오후 10시~새벽 1시가 됩니다. 이 현실을 무시하고 한국 팀만으로 미국 영업을 시도하면 응답 시간이 늦어지고 기회를 놓칩니다. 특히 미국 B2B 바이어는 '24시간 응답'을 기대하지 않지만, '같은 영업일 내 응답'을 기대합니다. 최소한 미국 현지 SDR(Sales Development Representative) 1명 또는 미국 기반 파트너를 통해 front-line 응대를 현지화하는 것이 필수입니다.",
      },
      {
        type: "h3",
        text: "실수 5: Legal/Security Review 준비가 안 됐다",
      },
      {
        type: "p",
        text: "미국 중견기업 이상과 계약하려면 SOC 2 Type II 인증, MSA(Master Service Agreement) 검토, 데이터 처리 계약(DPA) 등이 거의 필수입니다. SOC 2 감사는 준비부터 완료까지 통상 6~12개월이 걸립니다. 이를 모른 채 엔터프라이즈 딜을 추진하다가 'We need SOC 2 before we can proceed'라는 말에 6개월을 허비하는 팀을 여럿 봤습니다. SOC 2 준비는 미국 첫 영업 활동과 병렬로 시작해야 합니다.",
      },
      {
        type: "ul",
        items: [
          "Vanta 또는 Drata 같은 compliance automation 플랫폼을 활용하면 SOC 2 준비 기간을 3~4개월로 단축 가능",
          "MSA 초안은 Clerky, Stripe Atlas의 템플릿에서 시작해 현지 변호사 검토 권장",
          "GDPR + CCPA 동시 대응이 필요한 경우 OneTrust 또는 Termly 활용",
        ],
      },
    ],
  },

  {
    id: 2,
    slug: "us-fintech-investment-trends-2026",
    title: "2026년 미국 핀테크 투자 트렌드와 한국 스타트업의 기회",
    excerpt:
      "금리 인하 사이클이 불러온 핀테크 르네상스. 임베디드 파이낸스와 B2B 결제 인프라 분야에서 한국 스타트업이 노릴 수 있는 틈새 시장을 분석합니다.",
    category: "Fintech",
    tags: ["Fintech", "투자트렌드", "2026"],
    readTime: 10,
    date: "2026. 03. 15",
    author: {
      name: "James Park",
      title: "Stanford GSB MBA '23 · Fintech & GTM",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.65 0.15 250 / 0.15)",
    gradientTo: "oklch(0.65 0.15 250 / 0.03)",
    accentColor: "var(--color-blue)",
    tldr: [
      "2025년 미국 핀테크 VC 투자액이 반등했다. 임베디드 파이낸스와 AI underwriting이 핵심 성장 카테고리다.",
      "YC W25 배치에서 핀테크 스타트업 비중이 18%로 역대 최고를 기록했다.",
      "한국 스타트업은 B2B 크로스보더 결제와 AI 기반 중소기업 금융에서 차별화 기회가 있다.",
    ],
    body: [
      {
        type: "p",
        text: "2022~2023년 금리 급등기에 핀테크 섹터는 가장 큰 타격을 받았습니다. Klarna는 기업 가치가 $45.6B에서 $6.7B로 85% 폭락했고, 많은 BaaS(Banking-as-a-Service) 스타트업이 정리됐습니다. 하지만 2024년 하반기 Fed의 금리 인하 사이클이 시작되면서 분위기가 반전됐습니다. 2025년 미국 핀테크 VC 투자액은 전년 대비 41% 증가한 $28.4B를 기록했고, 2026년에도 이 추세가 이어지고 있습니다.",
      },
      {
        type: "stat",
        label: "2025년 미국 핀테크 VC 투자액",
        value: "$28.4B",
        hint: "2024년 대비 +41% (CB Insights, 2026 Q1 Report)",
      },
      {
        type: "h2",
        text: "임베디드 파이낸스: 가장 뜨거운 카테고리",
      },
      {
        type: "p",
        text: "임베디드 파이낸스(Embedded Finance)란 비금융 기업의 플랫폼에 금융 서비스를 내장하는 것을 말합니다. Shopify가 Shopify Capital로 판매자에게 대출을 해주고, Uber가 운전자에게 직불카드를 제공하는 방식이 대표적입니다. 이 시장을 가능하게 하는 인프라 레이어인 BaaS에서 Unit($100M+ Series C, 2024), Synctera($33M Series B, 2024), Treasury Prime이 성장을 이어가고 있습니다. a16z와 Sequoia는 2024~2025년 이 카테고리에 집중적으로 베팅했습니다.",
      },
      {
        type: "h2",
        text: "B2B 결제 인프라: Stripe 생태계와 그 틈새",
      },
      {
        type: "p",
        text: "Stripe가 $70B 기업 가치로 독점하는 것처럼 보이는 B2B 결제 시장에도 틈새가 있습니다. Modern Treasury($180M Series C)는 자금 이동 오케스트레이션(money movement orchestration)에 특화돼 있고, Moov Financial은 embedded ACH/RTP 인프라를 제공합니다. YC W25 배치에서는 AI를 결합한 결제 인보이싱 및 수금 자동화 스타트업이 다수 배출됐습니다. 이 영역에서 한국 팀의 강점인 빠른 개발 속도와 B2B SaaS 경험이 빛을 발할 수 있습니다.",
      },
      {
        type: "h2",
        text: "YC 최근 배치에서 보이는 핀테크 트렌드",
      },
      {
        type: "ul",
        items: [
          "W24: AI-native expense management (Ramp 경쟁), SMB 보험 자동화, 크로스보더 payroll 3사 채택",
          "S24: Stablecoin 기반 B2B 국제 송금, 중소기업 신용 평가 AI, 부동산 모기지 자동화",
          "W25: AI underwriting (보험/대출), embedded B2B BNPL, 의료비 결제 플랫폼 다수 — 핀테크 비중 18%로 역대 최고",
        ],
      },
      {
        type: "h2",
        text: "한국 스타트업의 실질적 기회",
      },
      {
        type: "p",
        text: "제가 Harvard MBA 재학 중 핀테크 스타트업 포럼에서 만난 한국 팀 K사는 국내에서 수출입 중소기업 대상 FX 헤징 플랫폼을 운영했습니다. 이 팀이 미국에 진출했을 때, 미국 내 아시아계 수출입 중소기업(연 매출 $1M~$50M) 세그먼트가 완벽한 초기 ICP가 됐습니다. 언어·문화적 이해와 기존 제품 역량을 결합해 첫 해 ARR $1.2M을 달성했습니다.",
      },
      {
        type: "blockquote",
        text: "한국 팀의 강점은 빠른 실행력과 B2B 제품 운영 경험입니다. 미국 핀테크 시장에서 이 강점이 가장 빛을 발하는 곳은 '아직 대형 플레이어가 진입하지 않은 중소기업 니치'입니다.",
        attribution: "James Park",
      },
      {
        type: "h2",
        text: "주목해야 할 세 가지 기회 영역",
      },
      {
        type: "ul",
        items: [
          "크로스보더 B2B 결제: 한국-미국 무역 기업 대상 FX + 결제 통합 플랫폼",
          "AI Underwriting: 한국에서 쌓은 대안 신용 데이터 모델을 미국 이민자·신규 사업자에 적용",
          "중소기업 임베디드 파이낸스: 한국 SaaS 플랫폼 위에 대출·보험 레이어를 얹는 전략",
        ],
      },
    ],
  },

  {
    id: 3,
    slug: "ai-startup-us-market-beyond-technology",
    title: "AI 스타트업의 미국 시장 진출: 기술력만으로는 부족하다",
    excerpt:
      "세계 최고 수준의 AI 모델을 가지고도 미국 시장에서 외면받는 한국 AI 스타트업들. Enterprise AI 도입 의사결정자의 실제 구매 기준을 해부합니다.",
    category: "AI/DeepTech",
    tags: ["AI", "DeepTech", "Enterprise"],
    readTime: 9,
    date: "2026. 03. 12",
    author: {
      name: "David Kim",
      title: "Kellogg MBA '22 · AI & Enterprise",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.72 0.19 155 / 0.12)",
    gradientTo: "oklch(0.72 0.19 155 / 0.02)",
    accentColor: "var(--color-green)",
    tldr: [
      "엔터프라이즈 AI 바이어는 모델 성능보다 ROI, 보안, 데이터 잔류(data residency)를 먼저 본다.",
      "LLM wrapper 제품은 OpenAI/Anthropic의 pricing 변화 한 번에 사업 모델이 흔들릴 수 있다.",
      "Vertical AI(특정 산업 특화)가 Horizontal AI보다 엔터프라이즈 세일즈에 훨씬 유리하다.",
    ],
    body: [
      {
        type: "p",
        text: "2024~2025년 한국에서 AI 스타트업 붐이 일었습니다. LLM 파인튜닝, 멀티모달 모델, RAG 파이프라인을 구축한 팀들이 '우리 모델이 GPT-4보다 한국어 성능이 높다'는 무기를 들고 미국 시장의 문을 두드렸습니다. 하지만 대부분 문이 열리지 않았습니다. Stanford AI Lab 출신 동료들과 나눈 대화와 제가 직접 도운 사례들을 바탕으로, 그 이유를 해부합니다.",
      },
      {
        type: "h2",
        text: "Enterprise AI 바이어가 실제로 보는 것",
      },
      {
        type: "p",
        text: "제가 함께 일한 Fortune 1000 기업의 Chief Data Officer(CDO)들을 인터뷰한 결과, 그들의 AI 솔루션 평가 기준은 다음 순서였습니다. 모델 성능은 리스트에서 3번째였습니다.",
      },
      {
        type: "ol",
        items: [
          "ROI 명확성: '90일 안에 어떤 비용이 얼마나 줄거나 매출이 얼마나 늘어나는가?'",
          "보안 및 데이터 잔류(Data Residency): '우리 데이터가 어디에 저장되는가? 모델 학습에 쓰이는가?'",
          "모델 성능: '실제 우리 use case에서 정확도가 어떻게 되는가?'",
          "벤더 안정성: '이 회사가 2년 후에도 존재할 것인가?'",
          "통합 용이성: '기존 스택(Salesforce, SAP, ServiceNow 등)과 얼마나 쉽게 연결되는가?'",
        ],
      },
      {
        type: "h2",
        text: "LLM Wrapper vs. AI-Native Product",
      },
      {
        type: "p",
        text: "많은 한국 AI 스타트업이 OpenAI나 Anthropic API 위에 UI를 얹은 'LLM wrapper' 제품을 출시했습니다. 문제는 이 구조에서는 기반 모델 제공사가 경쟁자가 될 수 있고, API 가격 변동에 마진이 직격타를 받는다는 점입니다. 반면 AI-native 제품은 AI가 핵심 워크플로우에 깊이 통합돼 있어 교체 비용(switching cost)이 높습니다. 예를 들어 의료 영상 판독 AI는 단순 API wrapper가 아니라 병원 PACS 시스템과 통합된 워크플로우 자체를 재구성합니다.",
      },
      {
        type: "stat",
        label: "Enterprise AI 계약 평균 ACV",
        value: "$180,000",
        hint: "Horizontal AI 툴 평균 vs Vertical AI 평균 $340,000 (Bessemer Venture Partners, 2025)",
      },
      {
        type: "h2",
        text: "Vertical vs. Horizontal AI: 엔터프라이즈 세일즈 관점",
      },
      {
        type: "p",
        text: "Horizontal AI(모든 산업에 적용 가능한 범용 AI)는 TAM이 크지만 경쟁이 치열하고 엔터프라이즈 바이어 설득이 어렵습니다. 반면 Vertical AI(특정 산업 특화)는 TAM은 작지만 도메인 전문성이 해자(moat)가 됩니다. 법률 AI(Harvey), 의료 AI(Abridge), 건설 AI(Buildots) 등이 대표적입니다. 제가 도운 한국 AI 스타트업 M사는 반도체 공정 이상 탐지 AI를 갖고 있었는데, 이를 '범용 제조 AI'로 포지셔닝하다 실패하고 '반도체 Fab 특화 quality control AI'로 재포지셔닝한 후 6개월 만에 첫 미국 파일럿 계약을 체결했습니다.",
      },
      {
        type: "h2",
        text: "Anthropic/OpenAI 파트너십 전략",
      },
      {
        type: "p",
        text: "자체 모델을 갖춘 팀이 아니라면, OpenAI나 Anthropic의 공식 파트너 프로그램(OpenAI Partner Program, Anthropic Partners)에 등록하는 것이 미국 세일즈에 의외로 강력한 레버가 됩니다. 이들의 파트너 디렉토리에 리스팅되면 해당 플랫폼을 도입하려는 엔터프라이즈 고객으로부터 inbound 문의가 들어옵니다. 2025년 기준 Anthropic Partners 디렉토리에 등록된 회사들은 월 평균 40~80건의 inbound 리드를 받았다고 보고됩니다.",
      },
      {
        type: "h2",
        text: "한국 AI 스타트업의 실전 함정",
      },
      {
        type: "ul",
        items: [
          "한국어 데이터로 학습한 모델을 영어 도메인에 그대로 적용 — 성능 격차 발생",
          "'우리 벤치마크 스코어가 높다'를 세일즈 포인트로 사용 — 바이어는 벤치마크보다 실제 use case 데모를 원함",
          "보안/컴플라이언스 문서 부재 — SOC 2, HIPAA, GDPR 등 없으면 enterprise 논의 불가",
          "모델 업데이트 주기를 과도하게 빠르게 설정 — 엔터프라이즈는 안정성을 원함",
        ],
      },
    ],
  },

  {
    id: 4,
    slug: "us-d2c-branding-strategy-guide",
    title: "미국 D2C 시장 진출을 위한 브랜딩 전략 가이드",
    excerpt:
      "아마존 의존에서 벗어나 독립 브랜드로 성장하는 법. 미국 소비자 심리와 퍼포먼스 마케팅을 결합한 D2C 진출 로드맵을 공유합니다.",
    category: "E-commerce",
    tags: ["D2C", "브랜딩", "E-commerce"],
    readTime: 7,
    date: "2026. 03. 10",
    author: {
      name: "Elena Rodriguez",
      title: "Columbia Business MBA '24 · Consumer & Brand",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.78 0.15 75 / 0.13)",
    gradientTo: "oklch(0.78 0.15 75 / 0.02)",
    accentColor: "var(--color-amber)",
    tldr: [
      "iOS 14.5 이후 Facebook 광고 ROAS가 평균 35% 하락했다. 퍼포먼스 마케팅 단독 전략은 한계다.",
      "COSRX, Anua는 Reddit과 TikTok 커뮤니티에서 시작한 유기적 버즈가 미국 D2C 성공의 핵심이었다.",
      "Amazon을 발판으로 DTC 채널로 전환하는 '2-track 전략'이 2026년 현재 가장 검증된 진출 패턴이다.",
    ],
    body: [
      {
        type: "p",
        text: "Kellogg에서 Consumer Marketing을 가르치며 동시에 한국 뷰티·F&B 브랜드의 미국 진출을 돕는 제 입장에서, 지난 5년간 D2C 시장에서 가장 극적인 변화는 2021년 4월 Apple의 iOS 14.5 업데이트였습니다. 이 업데이트 하나가 미국 D2C 브랜드의 성장 방정식을 완전히 바꿔놓았습니다.",
      },
      {
        type: "h2",
        text: "Post-iOS 14.5 시대: 퍼포먼스 마케팅의 한계",
      },
      {
        type: "p",
        text: "iOS 14.5의 앱 추적 투명성(App Tracking Transparency) 정책으로 Facebook 픽셀 기반 리타겟팅의 효율이 급락했습니다. 2021년 이전 D2C 브랜드들은 Facebook 광고 ROAS(광고비 대비 수익률) 3~5배를 당연하게 여겼지만, 2025년 기준 평균 ROAS는 1.8~2.3배 수준입니다. 마케팅 비용은 늘었는데 효율은 낮아진 것입니다. 이제 '광고비 ×2 = 매출 ×2' 공식은 작동하지 않습니다.",
      },
      {
        type: "stat",
        label: "2025년 Facebook D2C 광고 평균 ROAS",
        value: "2.1x",
        hint: "2021년 이전 평균 4.2x 대비 50% 하락 (Triple Whale Benchmarks, 2025)",
      },
      {
        type: "h2",
        text: "K-뷰티 성공 사례: COSRX와 Anua가 미국에서 터진 이유",
      },
      {
        type: "p",
        text: "COSRX는 광고비보다 Reddit의 r/SkincareAddiction 커뮤니티에서의 유기적 추천이 미국 진출의 발화점이었습니다. 2019년 한 사용자의 'COSRX Snail Mucin 후기'가 수천 개의 공감을 받으면서 브랜드 인지도가 폭발했고, 이후 Amazon 매출이 급증했습니다. Anua의 경우 2023~2024년 TikTok에서 '#anua' 해시태그 영상이 5억 뷰를 돌파하면서 Sephora 입점 협상으로 이어졌습니다. Tirtir는 'match my shade' UGC 챌린지를 통해 다양한 피부톤 포용성 메시지로 미국 Z세대를 사로잡았습니다.",
      },
      {
        type: "h2",
        text: "Amazon + DTC 2-Track 전략",
      },
      {
        type: "p",
        text: "2026년 현재 가장 검증된 미국 진출 패턴은 Amazon을 발판(distribution channel)으로 시작해 독립 DTC 채널을 구축하는 'Amazon → Shopify 전환' 전략입니다. Amazon은 즉각적인 유통망과 Prime 물류 인프라를 제공하지만, 고객 데이터를 가져갈 수 없고 브랜드 경험을 통제하기 어렵습니다. Amazon에서 product-market fit을 검증한 후 Shopify 스토어를 론칭하고, Amazon 구매자를 이메일·SMS 채널로 전환하는 것이 핵심입니다.",
      },
      {
        type: "h2",
        text: "Shopify 생태계 핵심 툴",
      },
      {
        type: "ul",
        items: [
          "Klaviyo: 이메일/SMS 마케팅 자동화. DTC 브랜드의 사실상 표준 (월 $45~)",
          "Recharge: 구독 상품 결제 관리. 소모품 카테고리 필수 (월 $99~)",
          "Gorgias: 고객 서비스 헬프데스크. Shopify 주문 데이터와 통합 (월 $10~)",
          "Triple Whale: 멀티채널 마케팅 어트리뷰션. post-iOS 14.5 시대 필수 (월 $129~)",
          "Okendo: 리뷰 & UGC 수집. 구매 전환율 23% 향상 효과 보고 (월 $19~)",
        ],
      },
      {
        type: "h2",
        text: "TikTok Shop의 부상과 리스크",
      },
      {
        type: "p",
        text: "2024년 TikTok Shop이 미국에서 본격화되면서 뷰티·생활용품 카테고리에서 엄청난 판매 속도를 보여주고 있습니다. 하지만 미국 정부의 TikTok 규제 리스크가 상존하는 만큼, TikTok Shop에 과도하게 의존하는 전략은 리스크를 수반합니다. TikTok을 발견(discovery) 채널로, 구매는 Amazon 또는 자사 Shopify로 유도하는 구조가 안전합니다.",
      },
      {
        type: "blockquote",
        text: "미국 소비자는 브랜드 스토리에 돈을 씁니다. 성분표가 아니라 '왜 이 브랜드인가'를 설득하십시오.",
        attribution: "Elena Rodriguez",
      },
    ],
  },

  {
    id: 5,
    slug: "us-healthcare-regulatory-guide",
    title: "미국 헬스케어 스타트업의 규제 환경 완벽 가이드",
    excerpt:
      "FDA, HIPAA, ONC 인증까지. 복잡한 미국 헬스케어 규제를 한국 스타트업 관점에서 단계별로 정리합니다. 규제를 피하는 법이 아닌 규제를 무기로 만드는 법.",
    category: "전략",
    tags: ["헬스케어", "규제", "FDA"],
    readTime: 14,
    date: "2026. 03. 07",
    author: {
      name: "Michael O'Brien",
      title: "HBS MBA '23 · Healthcare & Regulatory",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.63 0.2 25 / 0.12)",
    gradientTo: "oklch(0.63 0.2 25 / 0.02)",
    accentColor: "var(--color-red)",
    tldr: [
      "FDA 인허가는 제품 출시의 장벽이 아니라 진입 해자(moat)다. 경쟁자도 똑같이 넘어야 한다.",
      "한국 식약처 인증은 FDA 심사에 참고 자료는 되지만 면제 경로는 아니다.",
      "SaMD Class II 제품은 510(k)가 가장 빠른 경로. 평균 12~18개월, 비용 $30K~$150K.",
      "HIPAA compliance 없이는 미국 병원·보험사 계약이 원천적으로 불가능하다.",
    ],
    body: [
      {
        type: "p",
        text: "Columbia 의대 병원 전산 시스템 프로젝트와 디지털 헬스 스타트업 컨설팅을 병행하면서 느낀 것은, 미국 헬스케어 시장은 '규제가 가장 두꺼운 시장'이자 동시에 '규제를 무기로 만들면 가장 강력한 해자가 생기는 시장'이라는 점입니다. 이 글에서는 한국 디지털 헬스 스타트업이 반드시 알아야 할 규제 지형을 실용적으로 정리합니다.",
      },
      {
        type: "h2",
        text: "SaMD 분류: 내 제품이 의료기기인가?",
      },
      {
        type: "p",
        text: "SaMD(Software as a Medical Device)는 FDA가 하드웨어 없이 소프트웨어만으로 의료적 목적(진단, 치료, 예방, 모니터링)을 수행하는 제품에 적용하는 분류입니다. '우리 앱이 의료기기냐 아니냐'는 제품 디자인과 마케팅 문구에 달려 있습니다. 예를 들어 '당신의 심박수를 측정합니다'(wellness 앱)와 '부정맥을 탐지합니다'(Class II 의료기기)는 같은 기술이지만 전혀 다른 규제 경로를 걷습니다.",
      },
      {
        type: "ul",
        items: [
          "Class I (저위험): 일반적인 wellness 앱, 전자 의무기록 뷰어 → 대부분 FDA 등록만 필요",
          "Class II (중위험): 임상 의사결정 지원, 원격 모니터링 → 510(k) 심사 필요",
          "Class III (고위험): 생명 유지 장치, 이식형 기기 → PMA(시판 전 승인) 필요",
        ],
      },
      {
        type: "h2",
        text: "FDA 510(k): 가장 일반적인 SaMD 심사 경로",
      },
      {
        type: "p",
        text: "510(k)는 '우리 제품이 이미 FDA가 승인한 선행 제품(predicate device)과 실질적으로 동등하다'는 것을 증명하는 심사입니다. 새로운 임상 시험 데이터를 직접 생성하지 않아도 되기 때문에 가장 빠른 Class II 승인 경로입니다. 평균 심사 기간은 12~18개월, 비용은 regulatory 컨설팅 포함 $30K~$150K 수준입니다. 제가 도운 한국 디지털 헬스 팀 S사는 신경과 원격 모니터링 SaMD를 개발했는데, 미국 FDA 컨설턴트 고용부터 510(k) 승인까지 총 14개월이 걸렸습니다.",
      },
      {
        type: "stat",
        label: "FDA 510(k) 평균 심사 기간",
        value: "12~18개월",
        hint: "FDA MDUFA V 목표 기준 180일이나 실제 평균은 훨씬 길다",
      },
      {
        type: "h2",
        text: "HIPAA: 미국 의료 데이터의 기본 법칙",
      },
      {
        type: "p",
        text: "HIPAA(Health Insurance Portability and Accountability Act)는 환자 건강 정보(PHI: Protected Health Information)의 수집, 저장, 전송을 규제합니다. 미국 병원, 보험사, 클리닉과 계약하려면 BAA(Business Associate Agreement)를 체결해야 하는데, 이를 위해서는 HIPAA 컴플라이언스를 증명해야 합니다. 컴플라이언스는 기술적 보호조치(암호화, 접근 제어), 관리적 보호조치(직원 교육, 위험 평가), 물리적 보호조치(서버 접근 통제) 세 가지 레이어로 구성됩니다.",
      },
      {
        type: "h2",
        text: "한국 팀의 흔한 함정",
      },
      {
        type: "ul",
        items: [
          "한국 식약처 인증을 FDA 인증과 동일시 — 전혀 다른 시스템. 식약처 인증은 FDA 심사 참고 자료로만 사용 가능",
          "AWS HIPAA-Eligible Service 사용으로 HIPAA compliance가 자동 충족된다고 착각 — 인프라와 애플리케이션 레이어 컴플라이언스는 별개",
          "AI/ML 모델 재학습 시 FDA 승인 범위를 벗어날 수 있음 — AI-enabled SaMD는 별도 가이드라인 적용",
          "EHR 통합 시 ONC 인증 요건 무시 — Cures Act interoperability 규정 위반 시 벌금",
        ],
      },
      {
        type: "h2",
        text: "규제를 무기로 만드는 법",
      },
      {
        type: "p",
        text: "FDA 510(k) 승인서는 병원 구매 위원회 앞에서 가장 강력한 세일즈 자료입니다. 경쟁자가 똑같은 규제 장벽을 넘어야 하기 때문에, 먼저 승인받은 회사가 12~18개월의 선점 우위를 갖습니다. HIPAA compliance 문서화와 SOC 2 Type II를 함께 갖추면 '레드팀 검토'에서 경쟁 제품 대비 현저히 빠르게 통과됩니다. 규제 비용을 매몰 비용으로 보지 말고 진입 장벽 투자로 보십시오.",
      },
      {
        type: "blockquote",
        text: "규제는 느린 사람을 걸러내는 필터입니다. 빠르게 통과한 사람만이 그 필터를 방패로 쓸 수 있습니다.",
        attribution: "Michael O'Brien",
      },
    ],
  },

  {
    id: 6,
    slug: "enterprise-sales-b2b-saas-fortune500",
    title: "엔터프라이즈 세일즈: 한국 B2B SaaS의 미국 대기업 공략법",
    excerpt:
      "포춘 500 기업에 소프트웨어를 판매하는 일. 12개월 영업 사이클, 멀티스레딩, 챔피언 빌딩까지 Enterprise 세일즈의 모든 것을 다룹니다.",
    category: "SaaS",
    tags: ["Enterprise", "B2B", "세일즈"],
    readTime: 11,
    date: "2026. 03. 04",
    author: {
      name: "Marcus Johnson",
      title: "Chicago Booth MBA '23 · Enterprise Sales",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.82 0.15 85 / 0.12)",
    gradientTo: "oklch(0.82 0.15 85 / 0.02)",
    accentColor: "var(--color-gold)",
    tldr: [
      "미국 엔터프라이즈 영업 사이클은 평균 9~18개월이다. 한국의 3~6개월 기준으로 계획하면 현금이 먼저 바닥난다.",
      "단일 챔피언에 의존하는 영업은 그 사람이 퇴사하면 딜 전체가 사망한다. 멀티스레딩은 선택이 아닌 필수다.",
      "무료 POC를 8주 이상 허용하지 마라. 무료 POC가 길어지면 '구매 의사 없음' 신호다.",
    ],
    body: [
      {
        type: "p",
        text: "Booth MBA 졸업 후 Oracle에서 엔터프라이즈 세일즈를 3년 경험하고, 이후 한국 B2B SaaS 스타트업들의 미국 진출을 도운 저에게 가장 자주 듣는 질문은 '왜 미국 대기업들은 이렇게 결정이 느린가?'입니다. 느린 게 아닙니다. 구조가 다른 겁니다.",
      },
      {
        type: "h2",
        text: "엔터프라이즈 영업 사이클의 현실",
      },
      {
        type: "p",
        text: "한국 B2B 시장에서 중견기업 대상 SaaS 계약은 3~6개월이면 클로즈됩니다. 하지만 미국 Fortune 500 대상 SaaS 계약은 평균 9~18개월입니다. $100K ACV 이상은 12개월+, $500K ACV 이상은 18개월+가 일반적입니다. 이 사이클을 무시하고 12개월치 runway로 미국 엔터프라이즈 세일즈를 시작하면 첫 계약 클로즈 전에 자금이 바닥납니다.",
      },
      {
        type: "stat",
        label: "미국 Enterprise SaaS 평균 영업 사이클",
        value: "12.4개월",
        hint: "ACV $100K 이상 기준 (Gartner, 2025 B2B Sales Report)",
      },
      {
        type: "h2",
        text: "MEDDPICC: 엔터프라이즈 세일즈의 언어",
      },
      {
        type: "p",
        text: "MEDDPICC는 미국 엔터프라이즈 세일즈에서 기회(opportunity) 자격 평가와 딜 관리에 가장 널리 쓰이는 프레임워크입니다. Metrics(측정 가능한 비즈니스 임팩트), Economic Buyer(예산 집행자), Decision Criteria(평가 기준), Decision Process(의사결정 프로세스), Paper Process(계약 절차), Identified Pain(식별된 핵심 문제), Champion(내부 옹호자), Competition(경쟁 현황) 여덟 가지 항목을 지속적으로 업데이트하며 딜을 관리합니다. 이 중 하나라도 'Unknown'이면 딜은 아직 자격이 안 된 것입니다.",
      },
      {
        type: "h2",
        text: "멀티스레딩: 왜 챔피언 한 명에게 의존하면 안 되는가",
      },
      {
        type: "p",
        text: "제가 함께 일한 한국 팀 P사는 미국 대형 물류기업의 Director of Operations를 챔피언으로 확보하고 8개월을 공들였습니다. 그런데 계약 서명 2주 전, 그 챔피언이 퇴사했습니다. 새 담당자는 프로젝트를 처음 본 사람이었고, 딜은 처음부터 다시 시작해야 했습니다. 멀티스레딩이란 챔피언 외에 최소 2~3명의 stakeholder와 독립적인 관계를 구축하는 것을 말합니다. VP, IT 보안 담당자, 법무팀 등 계약 프로세스에 관여하는 모든 사람과 별도로 신뢰를 쌓아야 합니다.",
      },
      {
        type: "h2",
        text: "POC 함정: 무료 POC가 길어지면 죽는다",
      },
      {
        type: "p",
        text: "엔터프라이즈 바이어는 '무료로 더 써볼 수 있으면 당연히 써보겠다'는 심리가 있습니다. 이 심리에 이끌려 POC를 무한정 연장해주는 팀이 많습니다. 하지만 현장 경험상, 8주 이상 지속되는 무료 POC의 80%는 계약으로 이어지지 않습니다. POC를 시작할 때 '8주 뒤에 계약 or No-go'를 명문화하고, POC 비용(유료 또는 조건부 계약)을 부과하는 것이 진지한 바이어를 걸러내는 가장 효과적인 필터입니다.",
      },
      {
        type: "h2",
        text: "Procurement 단계: 계약 직전의 지뢰밭",
      },
      {
        type: "ul",
        items: [
          "RFP(Request for Proposal): 대기업의 공식 벤더 선정 절차. 응답 시 기술 사양보다 비즈니스 임팩트 중심으로 작성",
          "Security Review: CAIQ(Consensus Assessments Initiative Questionnaire) 또는 자체 보안 설문 400~600문항. SOC 2 없으면 대부분 탈락",
          "Legal Redlines: 미국 법무팀의 MSA 조항 수정 요청. 쟁점은 대부분 데이터 소유권, 책임 한도, 계약 해지 조건",
          "Vendor Registration: 대기업의 공급업체 등록 절차. 소요 시간 2~6주, 서류 목록 미리 준비 필수",
        ],
      },
      {
        type: "h2",
        text: "2026년 Enterprise Sales의 변화",
      },
      {
        type: "p",
        text: "AI 기반 세일즈 인게이지먼트 툴(Outreach, Salesloft, Gong의 AI 코칭 기능)이 AE(Account Executive)의 생산성을 높이고 있지만, 동시에 구매자들도 AI-generated 이메일을 감지하는 능력이 생겼습니다. 2026년 엔터프라이즈 세일즈에서 가장 중요한 차별화는 여전히 '진짜 인간 관계'입니다. 산업 컨퍼런스 참석, 공통 투자자 네트워크, LinkedIn의 진성 콘텐츠가 AI 자동화 세일즈보다 여전히 효과적입니다.",
      },
      {
        type: "blockquote",
        text: "엔터프라이즈 세일즈는 스프린트가 아닌 마라톤입니다. 충분한 runway와 멘탈 체력을 갖추고 시작하십시오.",
        attribution: "Marcus Johnson",
      },
    ],
  },
];

// ─── All Articles (for static params, detail page) ────────────────────────────

export const ALL_ARTICLES: Article[] = [FEATURED_ARTICLE, ...ARTICLES];

export const CATEGORIES: Category[] = ["전체", "SaaS", "Fintech", "AI/DeepTech", "E-commerce", "전략"];
