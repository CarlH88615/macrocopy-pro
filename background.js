
// Helper to strip HTML for text-only contexts while preserving line breaks
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')     // Convert <br> to newline
    .replace(/<\/p>/gi, '\n')         // Convert </p> to newline
    .replace(/<p>/gi, '')             // Strip <p>
    .replace(/&nbsp;/g, ' ')          // Handle non-breaking space
    .replace(/<[^>]*>?/gm, '');       // Strip all other HTML tags
}

// Function to rebuild the entire context menu
async function rebuildMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get(['macros'], (result) => {
      const macros = result.macros || [];
      
      // Create Parent Menu
      chrome.contextMenus.create({
        id: "macrocopy-root",
        title: "MacroCopy Pro",
        contexts: ["editable", "selection"]
      });

      // Group by Category
      const categories = [...new Set(macros.map(m => m.category))];
      
      categories.forEach(cat => {
        chrome.contextMenus.create({
          id: `cat-${cat}`,
          parentId: "macrocopy-root",
          title: cat,
          contexts: ["editable", "selection"]
        });

        // Add Macros for this category
        macros.filter(m => m.category === cat).forEach(item => {
          chrome.contextMenus.create({
            id: `item-${item.id}`,
            parentId: `cat-${cat}`,
            title: item.title,
            contexts: ["editable", "selection"]
          });
        });
      });
    });
  });
}

// Listen for clicks on the context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('item-')) {
    const itemId = info.menuItemId.replace('item-', '');
    
    chrome.storage.local.get(['macros'], (result) => {
      const item = (result.macros || []).find(m => m.id === itemId);
      if (item) {
        const textToInsert = stripHtml(item.content);
        
        // Execute script in the active tab to insert text
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            const el = document.activeElement;
            if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
              // Try to insert directly
              if (el.isContentEditable) {
                // For rich text areas, we preserve formatting if we can, 
                // but since the input is plain text from context menu, we set it.
                el.innerText = text;
              } else {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                el.value = el.value.substring(0, start) + text + el.value.substring(end);
                el.selectionStart = el.selectionEnd = start + text.length;
              }
              // Dispatch input event so site knows it changed
              el.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              // Fallback: Copy to clipboard if not in an input
              const textArea = document.createElement("textarea");
              textArea.value = text;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand("copy");
              textArea.remove();
              // Note: alert might not show in extension background context easily, but here as reference
            }
          },
          args: [textToInsert]
        });
      }
    });
  }
});

// Initialize on install or storage change
chrome.runtime.onInstalled.addListener(rebuildMenu);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.macros) rebuildMenu();
});
