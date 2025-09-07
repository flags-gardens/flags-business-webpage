// modules/interactions/impressum.js
import { elements } from '../../shared/elements.js';

export function initImpressum() {
  const link = elements.impressumLink;
  const overlay = elements.impressumOverlay;
  
  if (!link || !overlay) return;
  
  link.addEventListener("click", (e) => {
    e.preventDefault();
    overlay.classList.add("visible");
  });
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("visible");
    }
  });
}
