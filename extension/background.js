async function updateBadge() {
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  await chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
  await chrome.action.setBadgeBackgroundColor({ color: enabled ? '#047857' : '#64748b' });
  await chrome.action.setTitle({ title: `Amazon Privacy Shield: ${enabled ? 'on' : 'off'}` });
}
chrome.runtime.onInstalled.addListener(() => updateBadge());
chrome.runtime.onStartup.addListener(() => updateBadge());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.enabled) updateBadge();
});
// Serialize shortcut events so rapid keypresses do not lose a toggle.
let toggles = Promise.resolve();
chrome.commands.onCommand.addListener(command => {
  if (command !== 'toggle-privacy') return;
  toggles = toggles.then(async () => {
    const { enabled } = await chrome.storage.local.get({ enabled: true });
    await chrome.storage.local.set({ enabled: !enabled });
  }).catch(error => console.error('Could not toggle privacy protection', error));
});
updateBadge();
