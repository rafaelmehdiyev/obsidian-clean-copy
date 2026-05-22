const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');

const DEFAULT_SETTINGS = {
  stripYaml: true,
  stripWikilinks: true,
  stripTags: true,
  stripBlockIds: true,
  stripCallouts: true,
  stripFormatting: false,
};

module.exports = class CleanCopyPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
	
    this.addRibbonIcon('copy', 'Clean Copy', () => {
      this.executeCleanCopy();
    });

    this.addCommand({
      id: 'clean-copy',
      name: 'Copy note without properties',
      callback: () => this.executeCleanCopy(),
    });

    this.addCommand({
      id: 'clean-copy-plain',
      name: 'Copy note as plain text (strip all formatting)',
      callback: () => this.executeCleanCopy({ forcePlain: true }),
    });

    this.addSettingTab(new CleanCopySettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  executeCleanCopy(overrides = {}) {
    const { MarkdownView } = require('obsidian');
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView && activeView.editor.somethingSelected()) {
      const selection = activeView.editor.getSelection();
      this.processAndCopy(selection, overrides);
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('⚠️ No active note found');
      return;
    }

    this.app.vault.read(activeFile).then((content) => {
      this.processAndCopy(content, overrides);
    });
  }

  processAndCopy(rawText, overrides = {}) {
    const s = { ...this.settings, ...overrides };
    let text = rawText;

    if (s.stripYaml) {
      text = text.replace(/^---[\s\S]*?---\s*\n?/, '');
    }

    if (s.stripCallouts) {
      text = text.replace(/^>\s*\[!.*?\]\s*[-+]?\s*.*$/gm, '');
      text = text.replace(/^>\s?/gm, '');            
    }

    if (s.stripWikilinks) {
      text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, p1, p2) => p2 ?? p1);
    }

    if (s.stripTags) {
      text = text.replace(/(?<=\s|^)#[^\s#]+/g, '');
    }

    if (s.stripBlockIds) {
      text = text.replace(/\s+\^[a-zA-Z0-9-]+$/gm, '');
    }

    if (s.stripFormatting || overrides.forcePlain) {
      text = text
        .replace(/(\*\*|__)(.*?)\1/g, '$2')   // bold
        .replace(/(\*|_)(.*?)\1/g, '$2')       // italic
        .replace(/~~(.*?)~~/g, '$1')           // strikethrough
        .replace(/`{1,3}[^`]*`{1,3}/g, '')    // inline code & code blocks (simple)
        .replace(/^#{1,6}\s+/gm, '')           // headings → plain text
        .replace(/^\s*[-*+]\s+/gm, '')         // unordered list bullets
        .replace(/^\s*\d+\.\s+/gm, '')         // ordered list numbers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) → text
    }

    text = text.replace(/\n{3,}/g, '\n\n').trim();
    this.copyToClipboard(text);
  }

  copyToClipboard(text) {
    if (!text) {
      new Notice('⚠️ Nothing to copy!');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      new Notice('📋 Copied to clipboard!');
    }).catch(() => {
      new Notice('❌ Failed to copy');
    });
  }
};

class CleanCopySettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Clean Copy — Settings' });

    const toggle = (name, desc, key) => {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addToggle((t) =>
          t.setValue(this.plugin.settings[key]).onChange(async (v) => {
            this.plugin.settings[key] = v;
            await this.plugin.saveSettings();
          })
        );
    };

    toggle('Strip YAML front matter', 'Remove the --- properties block at the top of notes.', 'stripYaml');
    toggle('Flatten wikilinks', 'Turn [[Note]] into plain text. Handles aliases too.', 'stripWikilinks');
    toggle('Strip inline tags', 'Remove #tags from copied text.', 'stripTags');
    toggle('Strip block IDs', 'Remove ^block-id anchors from the end of lines.', 'stripBlockIds');
    toggle('Strip callout syntax', 'Clean > [!NOTE] callout headers and blockquote arrows.', 'stripCallouts');
    toggle(
      'Strip Markdown formatting',
      'Remove **bold**, _italic_, headings, list bullets, etc. Off by default — use "Copy as plain text" command for one-off use.',
      'stripFormatting'
    );
  }
}
