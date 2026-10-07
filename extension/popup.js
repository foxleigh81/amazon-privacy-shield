const enabled = document.getElementById('enabled');
const style = document.getElementById('style');
const status = document.getElementById('status');
const error = document.getElementById('error');
function render(saved) {
  enabled.checked = saved.enabled !== false;
  style.value = saved.style === 'blur' ? 'blur' : 'hide';
  status.textContent = enabled.checked ? 'On · details concealed' : 'Off · details visible';
}
async function load() { render(await chrome.storage.local.get({ enabled: true, style: 'hide' })); }
async function save(settings) {
  enabled.disabled = style.disabled = true;
  error.hidden = true;
  try { await chrome.storage.local.set(settings); await load(); }
  catch { error.textContent = 'Could not save. Close and reopen this panel to retry.'; error.hidden = false; }
  finally { enabled.disabled = style.disabled = false; }
}
enabled.addEventListener('change', () => save({ enabled: enabled.checked }));
style.addEventListener('change', () => save({ style: style.value }));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.enabled || changes.style)) load().catch(() => {});
});
load().then(() => { enabled.disabled = style.disabled = false; }).catch(() => {
  status.textContent = 'Settings unavailable';
  error.textContent = 'Close and reopen this panel to retry.';
  error.hidden = false;
});
