/* components/ResumePreview.jsx */
import { renderPremiumPreview  } from "../lib/templates/premium";
import { renderModernPreview   } from "../lib/templates/modern";
import { renderCreativePreview } from "../lib/templates/creative";

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
