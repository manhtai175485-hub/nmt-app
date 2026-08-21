export function getDeadlineStatus(dossier) {
  if (!dossier?.due_at || dossier?.status === "sent") return null;
  const due = new Date(dossier.due_at).getTime();
  const now = Date.now();
  const hoursLeft = (due - now) / 3600000;
  if (hoursLeft < 0) return "overdue";
  if (hoursLeft < 24) return "soon";
  return "ontime";
}

export const DEADLINE_LABELS = {
  overdue: "Quá hạn",
  soon: "Sắp hết hạn",
  ontime: "Còn hạn",
};

export function isOverdue(dossier) {
  return getDeadlineStatus(dossier) === "overdue";
}

export function isDueSoon(dossier) {
  return getDeadlineStatus(dossier) === "soon";
}
