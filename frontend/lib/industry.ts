import Fuse from "fuse.js";

export type Company = { id: string; name: string; aliases?: string[] };

export const COMPANIES: Company[] = [
  { id: "amazon", name: "Amazon", aliases: ["Amazon.com, Inc.", "AWS", "Amazon Web Services"] },
  { id: "uber", name: "Uber", aliases: ["Uber Technologies, Inc.", "Uber Eats"] },
  { id: "google", name: "Google", aliases: ["Alphabet", "Google LLC"] },
  { id: "meta", name: "Meta", aliases: ["Facebook", "Meta Platforms, Inc."] },
  { id: "microsoft", name: "Microsoft", aliases: ["MSFT", "Microsoft Corporation"] },
  { id: "apple", name: "Apple", aliases: ["Apple Inc."] },
  { id: "bytedance", name: "ByteDance", aliases: ["TikTok"] },
  { id: "coursera", name: "Coursera" },
  { id: "udemy", name: "Udemy" },
  { id: "duolingo", name: "Duolingo" },
  { id: "khan", name: "Khan Academy" },
  { id: "pearson", name: "Pearson" },
  { id: "chegg", name: "Chegg" },
  { id: "2u", name: "2U, Inc." },
  { id: "blackboard", name: "Blackboard" },
  { id: "instructure", name: "Instructure (Canvas)" },
  { id: "zoom", name: "Zoom" },
  { id: "salesforce", name: "Salesforce" },
  { id: "adobe", name: "Adobe" },
];

const fuse = new Fuse(COMPANIES, {
  keys: ["name", "aliases"],
  threshold: 0.3, 
  includeScore: true,
});

export function searchCompanies(q: string, limit = 5): Company[] {
  if (!q.trim()) return [];
  const res = fuse.search(q.trim()).slice(0, limit).map(r => r.item);
  const starts = res.filter(c => c.name.toLowerCase().startsWith(q.toLowerCase()));
  const others = res.filter(c => !c.name.toLowerCase().startsWith(q.toLowerCase()));
  return [...starts, ...others];
}
