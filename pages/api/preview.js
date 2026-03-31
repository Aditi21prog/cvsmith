/* components/ResumePreview.jsx */
import { renderPremium } from "../../lib/templates/premium";
import { renderModern } from "../../lib/templates/modern";
import { renderCreative } from "../../lib/templates/creative";

export default function ResumePreview({ resume, template = "premium" }) {
  if (!resume) return null;

  switch (template) {
    case "modern":
      return renderModernPreview(resume);
    case "creative":
      return renderCreativePreview(resume);
    case "premium":
    default:
      return renderPremiumPreview(resume);
  }
}
