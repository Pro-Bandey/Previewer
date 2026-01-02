export class State {
  constructor() {
    this.tabs = [];            // [{id, name, type, content, export}]
    this.activeId = null;
    this.globalQuery = '';
    this.contextTabId = null;
  }
}
