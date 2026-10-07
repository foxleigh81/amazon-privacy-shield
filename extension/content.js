(() => {
  let state = { enabled: true, style: 'hide' };
  let revision = 0;
  function apply() {
    if (!document.documentElement) return;
    document.documentElement.setAttribute('data-amazon-privacy-shield', state.enabled ? 'on' : 'off');
    document.documentElement.setAttribute('data-amazon-privacy-style', state.style);
  }
  // Register before reading storage so a quick toggle cannot be lost to an old read.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    revision++;
    if (changes.enabled) state.enabled = changes.enabled.newValue !== false;
    if (changes.style) state.style = changes.style.newValue === 'blur' ? 'blur' : 'hide';
    apply();
  });
  const readRevision = revision;
  chrome.storage.local.get({ enabled: true, style: 'hide' }).then(saved => {
    if (revision !== readRevision) return;
    state = { enabled: saved.enabled !== false, style: saved.style === 'blur' ? 'blur' : 'hide' };
    apply();
  }).catch(() => apply()); // Keep the safe default if settings cannot be read.
  apply();
  if (!document.documentElement) {
    const observer = new MutationObserver(() => {
      if (document.documentElement) { apply(); observer.disconnect(); }
    });
    observer.observe(document, { childList: true });
  }
})();
