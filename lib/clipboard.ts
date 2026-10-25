/**
 * Copy text, true if it worked. The clipboard API is blocked in some browsers
 * (embedded and in-app ones, found Oct 2026 testing the decimal hours Copy):
 * there it copies through a selected, hidden field instead.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      /* the text is on screen to copy by hand */
    }
    area.remove();
    return ok;
  }
}
