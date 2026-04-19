// Cross-module callbacks to avoid circular imports.
// app.js assigns these after all modules are loaded.
export const cb = {
  handleMainAction:        null,
  onIndexerChange:         null,
  renderResults:           null,
  renderManualIndexersList: null,
  renderIndexersPanel:     null,
  renderTorrentsPanel:     null,
  renderWatchlist:         null,
  openAddTorrentModal:     null,
  addTorrentDirectly:      null,
};
