import { elements } from '../../shared/elements.js';

export function updateHouseWidth() {
  const mainTextWidth = elements.mainText.offsetWidth;
  console.log(`Main text width: ${mainTextWidth}px`);
  
  document.documentElement.style.setProperty(
    "--house-width",
    `${mainTextWidth * 2.2}px`
  );
  console.log(`Updated --house-width to ${mainTextWidth * 2.2}px`);
}

export function updateFlagMaxHeight() {
  const mainContainer = elements.mainContainer;
  const mainFlagContainer = elements.mainFlag;
  
  if (mainContainer && mainFlagContainer) {
    const mainHeight = mainContainer.offsetHeight;
    const flagTopOffset = mainFlagContainer.offsetTop;
    
    const maxHeight = mainHeight - flagTopOffset;
    mainFlagContainer.style.maxHeight = `${maxHeight}px`;
    
    console.log(
      `Main height: ${mainHeight}px, Flag top offset: ${flagTopOffset}px, Max height: ${maxHeight}px`
    );
  }
}

export function positionImpressumLink() {
    const mainContainer = elements.mainContainer;
    const impressumLink = elements.impressumLink;

    if (mainContainer && impressumLink) {
        const mainHeight = mainContainer.offsetHeight;
        impressumLink.style.top = `${mainHeight - 30}px`;
    }
}

export function initLayoutUpdates() {
  updateHouseWidth();
  updateFlagMaxHeight();
  positionImpressumLink();
  
  window.addEventListener("load", () => {
    updateHouseWidth();
    updateFlagMaxHeight();
    positionImpressumLink();
  });
  
  window.addEventListener("resize", () => {
    updateHouseWidth();
    updateFlagMaxHeight();
    positionImpressumLink();
  });
}