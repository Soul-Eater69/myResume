const STOPWORDS = new Set([
  "a","an","the","and","or","but","of","for","to","in","on","at","by","with","from",
  "as","is","are","was","were","be","been","being","have","has","had","do","does","did",
  "will","would","can","could","should","may","might","must","this","that","these","those",
  "it","its","we","you","your","our","their","they","he","she","his","her","them","us",
  "if","then","than","so","not","no","yes","up","down","out","over","under","about","into",
  "any","all","some","more","most","very","just","also","such","like","per","via","using",
  "etc","e","g","i","ii","iii",
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\-+#./ ]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

const KNOWN_SKILLS = [
  // languages
  "python","typescript","javascript","go","golang","rust","java","kotlin","swift","ruby","php",
  "c","c++","c#","scala","elixir","r","sql","bash","shell",
  // frontend
  "react","next.js","nextjs","vue","angular","svelte","remix","tailwind","html","css","sass",
  // backend
  "node","nodejs","node.js","express","nestjs","fastapi","django","flask","rails","spring",
  "graphql","rest","grpc","websocket",
  // data/infra
  "postgres","postgresql","mysql","mongodb","redis","kafka","rabbitmq","elasticsearch",
  "bigquery","snowflake","spark","airflow","dbt","hadoop",
  // cloud
  "aws","gcp","azure","terraform","kubernetes","k8s","docker","helm","lambda","s3","ec2",
  // ml/ai
  "pytorch","tensorflow","huggingface","langchain","llm","llms","rag","embeddings","openai",
  "anthropic","vector","pinecone","chroma","weaviate","cuda","ml","ai","nlp","cv",
  // observability
  "datadog","grafana","prometheus","sentry","opentelemetry","splunk",
  // tooling
  "git","github","gitlab","jira","linear","figma","ci/cd","ci","cd","jenkins","circleci",
];

const KNOWN_DOMAINS = [
  "fintech","healthtech","edtech","ecommerce","e-commerce","saas","b2b","b2c","enterprise",
  "devtools","developer-tools","developer tools","infra","platform","data","analytics","security",
  "cybersecurity","ai","ml","llm","gaming","social","marketplace","logistics","climate",
  "crypto","web3","blockchain","mobile","iot",
];

export function extractSkills(text: string): string[] {
  const lc = (text || "").toLowerCase();
  const found = new Set<string>();
  for (const skill of KNOWN_SKILLS) {
    const pattern = skill.includes(".") || skill.includes("+") || skill.includes("#")
      ? skill.replace(/[.+#]/g, "\\$&")
      : skill;
    const re = new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, "i");
    if (re.test(lc)) found.add(skill);
  }
  return Array.from(found);
}

export function extractDomains(text: string): string[] {
  const lc = (text || "").toLowerCase();
  const found = new Set<string>();
  for (const d of KNOWN_DOMAINS) {
    if (lc.includes(d)) found.add(d);
  }
  return Array.from(found);
}

export function topKeywords(text: string, n = 20): string[] {
  const counts = new Map<string, number>();
  for (const t of tokenize(text)) counts.set(t, (counts.get(t) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

export function inferSeniority(text: string):
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "lead"
  | "unspecified" {
  const lc = text.toLowerCase();
  if (/\bintern(ship)?\b/.test(lc)) return "intern";
  if (/\bprincipal\b/.test(lc)) return "principal";
  if (/\bstaff\b/.test(lc)) return "staff";
  if (/\blead\b|\btech lead\b|\bengineering lead\b/.test(lc)) return "lead";
  if (/\bsenior\b|\bsr\.?\b/.test(lc)) return "senior";
  if (/\bjunior\b|\bentry[-\s]?level\b|\bjr\.?\b/.test(lc)) return "junior";
  if (/\bmid[-\s]?level\b|\bintermediate\b|\bii\b|\biii\b/.test(lc)) return "mid";
  return "unspecified";
}
