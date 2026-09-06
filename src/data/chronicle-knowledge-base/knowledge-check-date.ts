export function getKnowledgeCheckDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}
