export type AdProvider = "adsense" | "prebid" | "ezoic" | "none";

export const adSlots = {
  header: { key: "header", label: "Header Banner", slotId: "header-slot" },
  afterFirstPara: { key: "afterFirstPara", label: "After First Paragraph", slotId: "after-first-para-slot" },
  inArticle: { key: "inArticle", label: "In Article", slotId: "in-article-slot" },
  sidebar: { key: "sidebar", label: "Sidebar", slotId: "sidebar-slot" },
  stickyFooter: { key: "stickyFooter", label: "Sticky Footer", slotId: "sticky-footer-slot" },
} as const;

export function getAdProvider(): AdProvider {
  if (process.env.PREBID_ENABLED === "true") {
    return "prebid";
  }

  if (process.env.NEXT_PUBLIC_ADSENSE_CLIENT) {
    return "adsense";
  }

  return "none";
}