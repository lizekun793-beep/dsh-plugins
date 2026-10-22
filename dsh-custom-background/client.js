window.__ModuleLoader__.load({
  id: '@local/custom-background',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'custom-background';
    const LEGACY_KEY = 'dsh.custom-background.v1';
    const STYLE_ID = '@local/custom-background/background.css';
    const PANEL_SELECTOR = 'div[data-phase]:has(> [data-slot="conversation.header"])';
    const API_SETTINGS = '/api/custom-background.settings';
    const API_IMAGE = '/api/custom-background.image';
    const API_DEBUG = '/api/custom-background.debug';
    const BUILD = 'v5';
    const MAX_FILE_BYTES = 15 * 1024 * 1024;
    const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
    const MAX_OUTPUT_SIDE = 2560;
    const DIM_MAX = 80;
    const BLUR_MAX = 20;

    const en = {
      'nav': 'Chat background',
      'enable.title': 'Show background',
      'enable.description': 'Draw the picture behind the whole conversation panel, including its header.',
      'image.title': 'Pictures',
      'image.description': 'Uploaded pictures stay on the server. Click one to use it, or click × to delete it.',
      'image.empty': 'No image selected',
      'image.choose': 'Choose image…',
      'image.adjust': 'Adjust crop',
      'image.remove': 'Remove',
      'gallery.use': 'Use this image',
      'gallery.delete': 'Delete this image',
      'gallery.add': 'Add image',
      'gallery.empty': 'No pictures yet. Use the + tile to add one.',
      'gallery.link': 'Link',
      'crop.reset': 'Reset',
      'url.placeholder': 'https://example.com/wallpaper.jpg',
      'url.apply': 'Use URL',
      'crop.title': 'Crop image',
      'crop.description': "Drag on the picture to choose the visible area. The box keeps the conversation panel's aspect ratio.",
      'crop.loading': 'Loading image…',
      'crop.status': 'Selection: {width} × {height} px',
      'crop.useSelection': 'Use selection',
      'crop.useOriginal': 'Use full image',
      'crop.cancel': 'Cancel',
      'dim.title': 'Dim',
      'dim.description': 'Darkens the picture. The light theme brightens it instead, keeping text readable.',
      'blur.title': 'Blur',
      'blur.description': 'Softens the picture.',
      'note.server': 'Saved on the Harness server: it survives restarts and shows in every browser that opens this page.',
      'status.retry': 'Retry',
      'error.needImage': 'Choose an image first, then turn the background on.',
      'error.network': 'Could not reach the server. Check the connection, then retry.',
      'error.server': 'The server rejected the change.',
      'error.type': 'That file is not an image.',
      'error.size': 'That image is too large for the browser picker (max 15 MB).',
      'error.read': 'The image could not be read.',
      'error.url': 'Enter an http(s) image URL.',
      'error.load': 'The image could not be loaded.',
      'error.cors': 'This image is hosted on a site that does not allow cropping. Use the full image instead.',
      'error.selection': 'Drag on the picture to choose a region first.',
      'error.crop': 'The image could not be prepared. Try another file.'
    };

    const zh = {
      'nav': '聊天背景',
      'enable.title': '显示背景',
      'enable.description': '在整个会话面板（包括顶部栏）后面绘制背景图。',
      'image.title': '图片库',
      'image.description': '上传的图片会保存在服务端。点击缩略图即可使用，点 × 删除。',
      'image.empty': '尚未选择图片',
      'image.choose': '选择图片…',
      'image.adjust': '调整裁剪',
      'image.remove': '移除',
      'gallery.use': '使用这张图片',
      'gallery.delete': '删除这张图片',
      'gallery.add': '添加图片',
      'gallery.empty': '还没有图片，点「+」添加。',
      'gallery.link': '链接',
      'crop.reset': '重置选区',
      'url.placeholder': 'https://example.com/wallpaper.jpg',
      'url.apply': '使用链接',
      'crop.title': '裁剪图片',
      'crop.description': '在图片上拖动，框选要显示的区域；选区会自动保持会话面板的比例。',
      'crop.loading': '正在加载图片…',
      'crop.status': '选区：{width} × {height} 像素',
      'crop.useSelection': '使用选区',
      'crop.useOriginal': '使用整张原图',
      'crop.cancel': '取消',
      'dim.title': '遮罩',
      'dim.description': '压暗图片；浅色主题下会提亮，以保证文字清晰。',
      'blur.title': '模糊',
      'blur.description': '柔化图片。',
      'note.server': '已保存在 Harness 服务端：重启不丢失，打开本页的每个浏览器都会看到同一张默认背景。',
      'status.retry': '重试',
      'error.needImage': '请先选择图片，再打开背景。',
      'error.network': '无法连接服务端，请检查后重试。',
      'error.server': '服务端拒绝了本次修改。',
      'error.type': '该文件不是图片。',
      'error.size': '图片过大（浏览器读取上限 15 MB）。',
      'error.read': '无法读取图片。',
      'error.url': '请输入 http(s) 图片链接。',
      'error.load': '无法加载图片。',
      'error.cors': '该图片所在的网站不允许浏览器裁剪，请改用整张原图。',
      'error.selection': '请先在图片上拖动，选择要显示的区域。',
      'error.crop': '无法处理这张图片，请换一张试试。'
    };

    const STATIC_CSS = [
      '.dshcb-section{display:flex;flex-direction:column;width:100%}',
      '.dshcb-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
      '.dshcb-row:last-child{border-bottom:none}',
      '.dshcb-copy{min-width:0}',
      '.dshcb-title{color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}',
      '.dshcb-desc{color:var(--dsw-alias-label-secondary);margin-top:4px;font-size:12px;line-height:18px}',
      '.dshcb-stack{display:flex;flex-direction:column;gap:10px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
      '.dshcb-preview{box-sizing:border-box;position:relative;width:100%;height:150px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px;display:flex;align-items:center;justify-content:center;overflow:hidden}',
      '.dshcb-preview img{display:block;width:100%;height:100%;object-fit:cover}',
      '.dshcb-actions{display:flex;flex-wrap:wrap;gap:8px}',
      '.dshcb-button{box-sizing:border-box;height:32px;padding:0 14px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:18px;cursor:pointer}',
      '.dshcb-button:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,var(--dsw-alias-bg-layer-1))}',
      '.dshcb-button:disabled{opacity:.45;cursor:default}',
      '.dshcb-button-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}',
      '.dshcb-button-primary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary) 88%,var(--dsw-alias-label-primary))}',
      '.dshcb-button-danger{color:var(--dsw-alias-state-error-primary)}',
      '.dshcb-button:focus-visible,.dshcb-switch:focus-visible,.dshcb-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dshcb-urlRow{display:flex;align-items:center;gap:8px}',
      '.dshcb-input{box-sizing:border-box;flex:1;min-width:0;height:32px;padding:0 10px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px}',
      '.dshcb-sliderRow{display:flex;align-items:center;gap:12px;min-width:220px}',
      '.dshcb-slider{flex:1;min-width:0;accent-color:var(--dsw-alias-brand-primary)}',
      '.dshcb-value{width:44px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshcb-switch{position:relative;flex:none;width:38px;height:22px;padding:0;border:none;border-radius:11px;cursor:pointer;background:color-mix(in srgb,var(--dsw-alias-label-primary) 18%,transparent);transition:background .15s ease}',
      '.dshcb-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary-new-colorprimary-new-color)}',
      '.dshcb-switch:disabled{opacity:.45;cursor:default}',
      '.dshcb-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-switch-thumb);box-shadow:0 1px 2px rgb(0 0 0 / 20%);transition:transform .15s ease}',
      '.dshcb-switch[aria-checked=true] .dshcb-knob{transform:translateX(16px)}',
      '.dshcb-cropViewport{box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:300px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);overflow:hidden;touch-action:none;cursor:crosshair}',
      '.dshcb-cropWrap{position:relative;display:inline-block;max-width:100%;max-height:100%;line-height:0}',
      '.dshcb-cropImage{display:block;max-width:100%;max-height:300px;width:auto;height:auto;user-select:none;-webkit-user-drag:none;pointer-events:none}',
      '.dshcb-cropBox{position:absolute;z-index:1;border:1.5px solid var(--dsw-static-neutral-bluish-00);border-radius:2px;box-shadow:0 0 0 1px rgb(0 0 0 / 40%),0 0 0 2000px rgb(0 0 0 / 55%);pointer-events:none}',
      '.dshcb-cropHandle{position:absolute;width:12px;height:12px;border-radius:2px;background:var(--dsw-static-neutral-bluish-00);border:1px solid rgb(0 0 0 / 45%);box-shadow:0 1px 2px rgb(0 0 0 / 35%);pointer-events:none}',
      '.dshcb-cropHandle-nw{left:0;top:0;transform:translate(-50%,-50%)}',
      '.dshcb-cropHandle-ne{left:100%;top:0;transform:translate(-50%,-50%)}',
      '.dshcb-cropHandle-sw{left:0;top:100%;transform:translate(-50%,-50%)}',
      '.dshcb-cropHandle-se{left:100%;top:100%;transform:translate(-50%,-50%)}',
      '.dshcb-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}',
      '.dshcb-thumb{position:relative;aspect-ratio:16/10;border-radius:var(--dsw-radius-sm);overflow:hidden;border:2px solid transparent;background:var(--dsw-alias-bg-layer-1);cursor:pointer}',
      '.dshcb-thumb-selected{border-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color)}',
      '.dshcb-thumb img{width:100%;height:100%;object-fit:cover;display:block}',
                  '.dshcb-thumb-delete{position:absolute;top:3px;right:3px;z-index:1;width:20px;height:20px;padding:0;border:none;border-radius:50%;background:rgb(0 0 0 / 55%);color:var(--dsw-static-neutral-bluish-00);font-size:14px;line-height:18px;cursor:pointer;display:grid;place-items:center}',
      '.dshcb-thumb-badge{position:absolute;left:4px;bottom:4px;padding:1px 6px;border-radius:999px;background:rgb(0 0 0 / 55%);color:var(--dsw-static-neutral-bluish-00);font-size:11px;line-height:16px}',
      '.dshcb-thumb-add{display:flex;align-items:center;justify-content:center;font:inherit;font-size:22px;color:var(--dsw-alias-label-secondary);border:1px dashed var(--dsw-alias-border-l2);background:transparent;cursor:pointer}',
      '.dshcb-cropStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}',
      '.dshcb-cropLoading{display:flex;align-items:center;justify-content:center;height:300px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshcb-error{margin-top:6px;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}',
      '.dshcb-note{padding-top:12px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}',
      '@media (prefers-reduced-motion:reduce){.dshcb-switch,.dshcb-knob{transition:none}}'
    ].join('');

    function clampInt(value, min, max, fallback) {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.min(max, Math.max(min, Math.round(number)));
    }

    function clamp01(value) {
      return Math.min(1, Math.max(0, value));
    }

    function cleanUrl(value) {
      if (typeof value !== 'string') return '';
      const url = value.trim();
      if (url === '' || url.length > 2048) return '';
      if (!/^https?:\/\/\S+$/i.test(url)) return '';
      return url;
    }

    function dataUrlToBytes(dataUrl) {
      const comma = dataUrl.indexOf(',');
      if (comma < 0) return null;
      const header = dataUrl.slice(0, comma);
      const mime = /data:([^;,]+)/.exec(header);
      if (!mime || !/^image\//i.test(mime[1])) return null;
      if (!/;base64/i.test(header)) return null;
      try {
        const binary = atob(dataUrl.slice(comma + 1));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return { bytes, type: mime[1].toLowerCase() };
      } catch {
        return null;
      }
    }

    /* ---- server-backed store ------------------------------------------------
     * The authoritative copy lives on the Harness host (index.js); this module
     * keeps a projection of it, repaints the wallpaper CSS on every change, and
     * serializes browser writes so slider drags cannot race out of order.
     */
    let server = { status: 'loading', enabled: false, dim: 30, blur: 0, mode: 'none', url: '', selected: null, images: [], hasImage: false, rev: '' };
    let styleTag;
    let writeQueue = Promise.resolve();
    const listeners = new Set();

    function publish(next) {
      server = next;
      paint();
      for (const listener of listeners) {
        try {
          listener();
        } catch {
          // A broken subscriber must not keep the others from repainting.
        }
      }
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }

    function thumbSrc(entry) {
      return `${API_IMAGE}?id=${encodeURIComponent(entry.id)}&v=${encodeURIComponent(entry.rev)}`;
    }

    function selectedEntry(snapshot) {
      if (!Array.isArray(snapshot.images)) return undefined;
      return snapshot.images.find((image) => image.id === snapshot.selected);
    }

    function imageSrc(snapshot) {
      if (snapshot.mode === 'url') return snapshot.url;
      if (snapshot.mode !== 'local') return '';
      const entry = selectedEntry(snapshot);
      if (entry !== undefined) return thumbSrc(entry);
      // Legacy single-image host response (before the gallery migration).
      if (snapshot.hasImage) return `${API_IMAGE}?v=${encodeURIComponent(snapshot.rev)}`;
      return '';
    }

    function buildStyles(current) {
      function selectImage(entry) {
        if (current.mode === 'local' && current.selected === entry.id) return;
        report('select', entry.id);
        commit({ mode: 'local', selected: entry.id, url: '', enabled: true }, { mode: 'local', selected: entry.id, url: '', enabled: true })
          .then((ok) => report('select-done', `${entry.id}:${ok ? 'ok' : 'failed'}:${server.selected}`));
      }

      function deleteImageItem(entry) {
        run(() => deleteImage(entry.id));
      }

      const src = imageSrc(current);
      if (!current.enabled || src === '') return STATIC_CSS;
      const url = JSON.stringify(src);
      const dim = (current.dim / 100).toFixed(2);
      const blur = current.blur;
      const mask = `linear-gradient(rgba(255,255,255,${dim}),rgba(255,255,255,${dim}))`;
      const darkMask = `linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim}))`;
      const filter = blur > 0
        ? `filter:blur(${blur}px);transform:scale(${(1 + blur / 100).toFixed(3)});`
        : '';
      return STATIC_CSS
        + `${PANEL_SELECTOR}{position:relative;isolation:isolate}`
        + `${PANEL_SELECTOR}::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;`
        + `background-image:${mask},url(${url});background-size:cover;background-position:center;`
        + 'background-repeat:no-repeat;'
        + filter
        + '}'
        + `body[data-ds-dark-theme] ${PANEL_SELECTOR}::before{background-image:${darkMask},url(${url})}`
        + `${PANEL_SELECTOR} [data-conversation-content][data-content-phase="active"] [data-composer-seat]{background:transparent}`;
    }

    function paint() {
      if (styleTag) styleTag.textContent = buildStyles(server);
    }

    /** Local legacy copy summary, safe against disabled storage. */
    function legacyInfo() {
      try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (raw === null) return { present: false };
        return { present: true, length: raw.length, head: raw.slice(0, 40) };
      } catch (error) {
        return { present: false, error: String(error && error.message || error).slice(0, 120) };
      }
    }

    /** Fire-and-forget diagnostic line; the host appends it to a capped log. */
    function report(kind, detail) {
      let panelCount = 0;
      let before = 0;
      try {
        const roots = document.querySelectorAll(PANEL_SELECTOR);
        panelCount = roots.length;
        if (roots.length > 0) before = getComputedStyle(roots[0], '::before').backgroundImage.length;
      } catch {
        // Diagnostics must never disturb the page.
      }
      const body = JSON.stringify({
        build: BUILD,
        kind,
        at: new Date().toISOString(),
        origin: location.origin,
        status: server.status,
        mode: server.mode,
        hasImage: server.hasImage,
        selected: server.selected,
        gallery: server.images.length,
        enabled: server.enabled,
        rev: server.rev,
        panelCount,
        before,
        legacy: legacyInfo(),
        detail: detail === undefined ? null : String(detail).slice(0, 300)
      });
      fetch(API_DEBUG, { method: 'POST', headers: { 'content-type': 'application/json' }, body }).catch(() => {});
    }

    function fromResponse(value) {
      return {
        status: 'ready',
        enabled: value.enabled === true,
        dim: clampInt(value.dim, 0, DIM_MAX, 30),
        blur: clampInt(value.blur, 0, BLUR_MAX, 0),
        mode: value.mode === 'local' || value.mode === 'url' ? value.mode : 'none',
        url: typeof value.url === 'string' ? value.url : '',
        selected: typeof value.selected === 'string' ? value.selected : null,
        images: Array.isArray(value.images) ? value.images.filter((image) => image && typeof image.id === 'string').map((image) => ({
          id: image.id,
          type: typeof image.type === 'string' ? image.type : 'image/webp',
          size: Number(image.size) || 0,
          rev: typeof image.rev === 'string' ? image.rev : image.id,
          addedAt: typeof image.addedAt === 'string' ? image.addedAt : ''
        })) : [],
        hasImage: value.hasImage === true,
        rev: typeof value.rev === 'string' ? value.rev : ''
      };
    }

    function enqueue(task) {
      const run = writeQueue.then(task);
      writeQueue = run.catch(() => undefined);
      return run;
    }

    /* Raw requests. They never enqueue: a task already running inside the write
     * queue that awaited another enqueue() would wait on itself forever, so only
     * the wrappers below (refresh/putSettings/postImage/deleteImage) enqueue and
     * in-queue work (the crop upload) calls these directly. */
    async function readSettings() {
      const response = await fetch(API_SETTINGS, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`settings ${response.status}`);
      return fromResponse(await response.json());
    }

    async function writeSettings(patch) {
      const response = await fetch(API_SETTINGS, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error(`settings ${response.status}`);
      return fromResponse(await response.json());
    }

    async function writeImage(bytes, type) {
      const response = await fetch(API_IMAGE, { method: 'POST', headers: { 'content-type': type }, body: bytes, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`image ${response.status}`);
      return fromResponse(await response.json());
    }

    async function removeImage(id) {
      const query = id === undefined ? '' : `?id=${encodeURIComponent(id)}`;
      const response = await fetch(API_IMAGE + query, { method: 'DELETE', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`image ${response.status}`);
      return fromResponse(await response.json());
    }

    async function refresh() {
      return enqueue(async () => {
        publish(await readSettings());
      });
    }

    /** Optimistic local echo + serialized server write; returns the settled snapshot. */
    function putSettings(patch, echo) {
      return enqueue(async () => {
        publish({ ...server, ...echo });
        publish(await writeSettings(patch));
      });
    }

    function postImage(bytes, type) {
      return enqueue(async () => {
        publish(await writeImage(bytes, type));
      });
    }

    function deleteImage(id) {
      return enqueue(async () => {
        publish(await removeImage(id));
      });
    }

    /** One-time promotion of the pre-server browser-local choice into the server default. */
    async function migrateLegacy() {
      let raw;
      try {
        raw = localStorage.getItem(LEGACY_KEY);
      } catch {
        return 'storage-unavailable';
      }
      if (raw === null) return 'absent';
      let legacy;
      try {
        legacy = JSON.parse(raw);
      } catch {
        legacy = null;
      }
      try {
        let outcome = 'skipped';
        if (legacy && typeof legacy === 'object' && server.mode === 'none' && !server.hasImage) {
          const source = typeof legacy.source === 'string' ? legacy.source.trim() : '';
          if (source.startsWith('data:image/')) {
            const decoded = dataUrlToBytes(source);
            if (decoded && decoded.bytes.byteLength <= MAX_UPLOAD_BYTES) {
              await postImage(decoded.bytes, decoded.type);
              await putSettings({
                enabled: legacy.enabled === true,
                dim: clampInt(legacy.dim, 0, DIM_MAX, 30),
                blur: clampInt(legacy.blur, 0, BLUR_MAX, 0)
              }, {});
              outcome = 'uploaded';
            } else {
              outcome = 'data-rejected';
            }
          } else {
            const url = cleanUrl(source);
            if (url) {
              await putSettings({
                mode: 'url',
                url,
                enabled: legacy.enabled === true,
                dim: clampInt(legacy.dim, 0, DIM_MAX, 30),
                blur: clampInt(legacy.blur, 0, BLUR_MAX, 0)
              }, {});
              outcome = 'url';
            } else {
              outcome = 'source-rejected';
            }
          }
        }
        localStorage.removeItem(LEGACY_KEY);
        return outcome;
      } catch (migrateError) {
        // A permanent server rejection (bad type, over cap) means promotion can
        // never succeed: drop the stale copy so the error clears on the next sync.
        if (/400|404|413/.test(String(migrateError && migrateError.message))) {
          try {
            localStorage.removeItem(LEGACY_KEY);
          } catch {
            // Storage disabled: the retry guard below still stops the loop.
          }
        }
        publish({ ...server, status: 'error' });
        return `failed:${String(migrateError && migrateError.message || migrateError).slice(0, 160)}`;
      }
    }

    function useServerState() {
      const [snapshot, setSnapshot] = React.useState(server);
      React.useEffect(() => subscribe(() => setSnapshot({ ...server })), []);
      return snapshot;
    }

    function Switch(props) {
      return h('button', {
        type: 'button',
        role: 'switch',
        className: 'dshcb-switch',
        'aria-checked': props.checked,
        'aria-label': props.label,
        disabled: props.disabled,
        onClick: () => props.onChange(!props.checked)
      }, h('span', { className: 'dshcb-knob' }));
    }

    function defaultSelection(naturalWidth, naturalHeight, ratio) {
      const imageAspect = naturalWidth / naturalHeight;
      if (imageAspect >= ratio) {
        const width = ratio / imageAspect;
        return { x: (1 - width) / 2, y: 0, w: width, h: 1 };
      }
      const height = imageAspect / ratio;
      return { x: 0, y: (1 - height) / 2, w: 1, h: height };
    }

    function BackgroundSection({ t }) {
      const current = useServerState();
      const [urlDraft, setUrlDraft] = React.useState(() => (current.mode === 'url' ? current.url : ''));
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [crop, setCrop] = React.useState(null);
      const [sel, setSel] = React.useState(null);
      const fileInput = React.useRef(null);
      const dragRef = React.useRef(null);
      const selRef = React.useRef(null);
      const cropWrapRef = React.useRef(null);
      const requestRef = React.useRef(0);

      function updateSelection(next) {
        selRef.current = next;
        setSel(next);
      }

      async function run(action) {
        setBusy(true);
        setError('');
        try {
          await action();
          return true;
        } catch (runError) {
          const message = String(runError && runError.message || '');
          if (/413/.test(message)) setError(t('error.size'));
          else if (/\d{3}/.test(message)) setError(t('error.server'));
          else setError(t('error.network'));
          report('action-failed', message);
          try {
            await refresh();
          } catch {
            publish({ ...server, status: 'error' });
          }
          return false;
        } finally {
          setBusy(false);
        }
      }

      function commit(patch, echo) {
        return run(() => putSettings(patch, echo));
      }

      function targetAspect() {
        try {
          const root = document.querySelector(PANEL_SELECTOR);
          if (root) {
            const rect = root.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return rect.width / rect.height;
          }
        } catch {
          // Engines without :has() fall through to the conversation body.
        }
        const body = document.querySelector('[data-conversation-content]');
        if (body) {
          const rect = body.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return rect.width / rect.height;
        }
        return 16 / 9;
      }

      function closeCrop() {
        requestRef.current += 1;
        dragRef.current = null;
        updateSelection(null);
        setCrop(null);
      }

      function openCrop(source, fromUrl) {
        const request = requestRef.current + 1;
        requestRef.current = request;
        setError('');
        dragRef.current = null;
        updateSelection(null);
        const image = new Image();
        image.onload = () => {
          if (requestRef.current !== request) return;
          if (!image.naturalWidth || !image.naturalHeight) {
            setCrop(null);
            setError(t('error.load'));
            return;
          }
          const ratio = targetAspect();
          setCrop({
            src: source,
            img: image,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            ratio,
            fromUrl,
            loading: false
          });
          updateSelection(defaultSelection(image.naturalWidth, image.naturalHeight, ratio));
        };
        image.onerror = () => {
          if (requestRef.current !== request) return;
          setCrop(null);
          setError(t('error.load'));
        };
        setCrop({ src: source, img: image, naturalWidth: 0, naturalHeight: 0, ratio: 16 / 9, fromUrl, loading: true });
        image.src = source;
      }

      function pickFile(event) {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        if (!/^image\//i.test(file.type || '')) {
          setError(t('error.type'));
          return;
        }
        if (file.size > MAX_FILE_BYTES) {
          setError(t('error.size'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          if (!result) {
            setError(t('error.read'));
            return;
          }
          openCrop(result, false);
        };
        reader.onerror = () => setError(t('error.read'));
        reader.readAsDataURL(file);
      }

      function applyUrl() {
        const url = cleanUrl(urlDraft);
        if (!url) {
          setError(t('error.url'));
          return;
        }
        openCrop(url, true);
      }

      function ratioNorm() {
        return crop === null ? 1 : (crop.naturalWidth / crop.naturalHeight) / crop.ratio;
      }

      function cornerAt(point, rect) {
        const current = selRef.current;
        if (current === null) return null;
        const near = (value, target, size) => Math.abs(value - target) * size <= 14;
        const left = near(point.x, current.x, rect.width);
        const right = near(point.x, current.x + current.w, rect.width);
        const top = near(point.y, current.y, rect.height);
        const bottom = near(point.y, current.y + current.h, rect.height);
        if (left && top) return 'nw';
        if (right && top) return 'ne';
        if (left && bottom) return 'sw';
        if (right && bottom) return 'se';
        return null;
      }

      function resizeSelection(drag, point) {
        const anchor = drag.anchor;
        const rN = drag.ratioNorm;
        const dirX = point.x >= anchor.x ? 1 : -1;
        const dirY = point.y >= anchor.y ? 1 : -1;
        let width = Math.abs(point.x - anchor.x);
        let height = Math.abs(point.y - anchor.y);
        if (width / rN > height) height = width / rN;
        else width = height * rN;
        const maxWidth = dirX > 0 ? 1 - anchor.x : anchor.x;
        const maxHeight = dirY > 0 ? 1 - anchor.y : anchor.y;
        const scale = Math.min(1, maxWidth / Math.max(width, 1e-6), maxHeight / Math.max(height, 1e-6));
        width *= scale;
        height *= scale;
        if (width < 0.06 && maxWidth >= 0.06) {
          width = Math.min(0.06, maxWidth);
          height = width * rN;
          if (height > maxHeight) {
            height = maxHeight;
            width = height / rN;
          }
        }
        const x = dirX > 0 ? anchor.x : anchor.x - width;
        const y = dirY > 0 ? anchor.y : anchor.y - height;
        return { x: clamp01(x), y: clamp01(y), w: Math.max(0, width), h: Math.max(0, height) };
      }

      function onCropPointerDown(event) {
        if (!crop || crop.loading || crop.naturalWidth === 0 || event.button !== 0) return;
        const wrap = cropWrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
        const point = {
          x: clamp01((event.clientX - rect.left) / rect.width),
          y: clamp01((event.clientY - rect.top) / rect.height)
        };
        const current = selRef.current;
        const corner = cornerAt(point, rect);
        const inside = current !== null && point.x >= current.x && point.x <= current.x + current.w && point.y >= current.y && point.y <= current.y + current.h;
        if (corner === null && !inside) return;
        event.preventDefault();
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is an optimization; dragging still works without it.
        }
        if (corner !== null && current !== null) {
          const anchor = {
            nw: { x: current.x + current.w, y: current.y + current.h },
            ne: { x: current.x, y: current.y + current.h },
            sw: { x: current.x + current.w, y: current.y },
            se: { x: current.x, y: current.y }
          }[corner];
          dragRef.current = { mode: 'resize', anchor, ratioNorm: ratioNorm() };
        } else if (current !== null) {
          dragRef.current = {
            mode: 'move',
            start: point,
            origin: { x: current.x, y: current.y },
            width: current.w,
            height: current.h
          };
        }
      }

      function onCropPointerMove(event) {
        const drag = dragRef.current;
        const wrap = cropWrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const point = {
          x: clamp01((event.clientX - rect.left) / rect.width),
          y: clamp01((event.clientY - rect.top) / rect.height)
        };
        if (drag === null) {
          const current = selRef.current;
          const corner = cornerAt(point, rect);
          const inside = current !== null && point.x >= current.x && point.x <= current.x + current.w && point.y >= current.y && point.y <= current.y + current.h;
          if (event.currentTarget && event.currentTarget.style !== undefined) {
            event.currentTarget.style.cursor = corner !== null ? 'nwse-resize' : inside ? 'move' : 'crosshair';
          }
          return;
        }
        if (drag.mode === 'move') {
          const x = clamp01(drag.origin.x + (point.x - drag.start.x));
          const y = clamp01(drag.origin.y + (point.y - drag.start.y));
          updateSelection({
            x: Math.min(x, 1 - drag.width),
            y: Math.min(y, 1 - drag.height),
            w: drag.width,
            h: drag.height
          });
          return;
        }
        updateSelection(resizeSelection(drag, point));
      }

      function onCropPointerUp(event) {
        if (dragRef.current === null) return;
        dragRef.current = null;
        try {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        } catch {
          // The capture may already have been released by the browser.
        }
      }

      async function encodeAndUpload(image, box) {
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        const width = Math.max(1, Math.round(box.w * naturalWidth));
        const height = Math.max(1, Math.round(box.h * naturalHeight));
        const startX = Math.max(0, Math.min(Math.round(box.x * naturalWidth), naturalWidth - width));
        const startY = Math.max(0, Math.min(Math.round(box.y * naturalHeight), naturalHeight - height));
        const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(width, height));
        const outputWidth = Math.max(1, Math.round(width * scale));
        const outputHeight = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const context = canvas.getContext('2d');
        if (!context) return Promise.reject(new Error('no canvas'));
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, startX, startY, width, height, 0, 0, outputWidth, outputHeight);
        const dataUrl = canvas.toDataURL('image/webp', 0.92);
        let encoded = dataUrlToBytes(dataUrl);
        if (!encoded) throw new Error('encode failed');
        if (encoded.bytes.byteLength > MAX_UPLOAD_BYTES) {
          const jpeg = canvas.toDataURL('image/jpeg', 0.85);
          encoded = dataUrlToBytes(jpeg);
          if (!encoded || encoded.bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error('too large');
        }
        // Runs inside the write queue already; enqueueing again would deadlock.
        publish(await writeImage(encoded.bytes, encoded.type));
        if (!server.enabled) publish(await writeSettings({ enabled: true }));
      }

      /** Save the staged crop; resolves true once the upload is committed. */
      async function confirmSelection(box) {
        if (!crop) return false;
        if (!box || box.w < 0.005 || box.h < 0.005) {
          setError(t('error.selection'));
          return false;
        }
        const request = requestRef.current;
        setBusy(true);
        setError('');
        try {
          if (crop.fromUrl) {
            // Same-origin crop of a remote picture requires the server to allow it;
            // a second clean CORS load keeps the canvas untainted.
            const corsImage = await new Promise((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = 'anonymous';
              image.onload = () => resolve(image);
              image.onerror = () => reject(new Error('cors'));
              image.src = crop.src;
            });
            if (requestRef.current !== request) return false;
            await enqueue(() => encodeAndUpload(corsImage, box));
          } else {
            await enqueue(() => encodeAndUpload(crop.img, box));
          }
          if (requestRef.current !== request) return false;
          setUrlDraft('');
          closeCrop();
          return true;
        } catch (uploadError) {
          if (requestRef.current !== request) return false;
          const message = String(uploadError && uploadError.message || '');
          if (message === 'cors') setError(t('error.cors'));
          else if (message === 'too large' || message === 'no canvas' || message === 'encode failed') setError(t('error.crop'));
          else if (/^image \d{3}$/.test(message)) setError(t('error.crop'));
          else setError(t('error.network'));
          return false;
        } finally {
          setBusy(false);
        }
      }

      async function applyFullImage() {
        if (!crop) return;
        if (crop.fromUrl) {
          const url = cleanUrl(crop.src);
          if (!url) {
            setError(t('error.url'));
            return;
          }
          if (await commit({ mode: 'url', url, enabled: true }, { mode: 'url', url, enabled: true })) {
            setUrlDraft(url);
            closeCrop();
          }
          return;
        }
        await confirmSelection({ x: 0, y: 0, w: 1, h: 1 });
      }

      const src = imageSrc(current);
      const offline = current.status === 'error';

      /** Switch turned on: save the staged crop first when there is no image yet. */
      async function enableBackground() {
        if (src === '') {
          if (crop && !crop.loading) {
            const box = selRef.current;
            if (!box || box.w < 0.005 || box.h < 0.005) {
              setError(t('error.selection'));
              return;
            }
            // One switch flip both saves the staged crop and turns it on.
            if (await confirmSelection(box)) await commit({ enabled: true }, { enabled: true });
            return;
          }
          setError(t('error.needImage'));
          return;
        }
        commit({ enabled: true }, { enabled: true });
      }

      function disableBackground() {
        commit({ enabled: false }, { enabled: false });
      }

      return h('div', { className: 'dshcb-section' },
        h('div', { className: 'dshcb-row' },
          h('div', { className: 'dshcb-copy' },
            h('div', { className: 'dshcb-title' }, t('enable.title')),
            h('div', { className: 'dshcb-desc' }, t('enable.description'))),
          h(Switch, {
            checked: current.enabled,
            disabled: busy || current.status === 'loading',
            label: t('enable.title'),
            onChange: (checked) => {
              if (checked) enableBackground();
              else disableBackground();
            }
          })),
        error !== '' || offline
          ? h('div', { className: 'dshcb-error', role: 'alert', key: 'error' },
              offline && error === '' ? t('error.network') : error,
              ' ',
              h('button', {
                type: 'button',
                className: 'dshcb-button',
                style: { height: 22, padding: '0 8px', fontSize: 12 },
                onClick: () => run(async () => {
                  await refresh();
                  await migrateLegacy();
                })
              }, t('status.retry')))
          : null,
        h('div', { className: 'dshcb-stack' },
          crop
            ? h(React.Fragment, null,
                h('div', { className: 'dshcb-title', key: 'crop-title' }, t('crop.title')),
                h('div', { className: 'dshcb-desc', key: 'crop-desc' }, t('crop.description')),
                crop.loading
                  ? h('div', { className: 'dshcb-cropLoading', key: 'crop-loading' }, t('crop.loading'))
                  : h('div', {
                      className: 'dshcb-cropViewport',
                      key: 'crop-viewport',
                      onPointerDown: onCropPointerDown,
                      onPointerMove: onCropPointerMove,
                      onPointerUp: onCropPointerUp,
                      onPointerCancel: onCropPointerUp
                    },
                      h('div', { className: 'dshcb-cropWrap', ref: cropWrapRef },
                        h('img', {
                          className: 'dshcb-cropImage',
                          src: crop.src,
                          alt: '',
                          draggable: false
                        }),
                        sel
                          ? h('div', {
                              className: 'dshcb-cropBox',
                              style: {
                                left: `${sel.x * 100}%`,
                                top: `${sel.y * 100}%`,
                                width: `${sel.w * 100}%`,
                                height: `${sel.h * 100}%`
                              }
                            }, ['nw', 'ne', 'sw', 'se'].map((corner) => h('span', {
                              key: corner,
                              className: `dshcb-cropHandle dshcb-cropHandle-${corner}`
                            })))
                          : null)),
                crop.loading || !sel
                  ? null
                  : h('div', { className: 'dshcb-cropStatus', key: 'crop-status' },
                      t('crop.status', {
                        width: Math.round(sel.w * crop.naturalWidth),
                        height: Math.round(sel.h * crop.naturalHeight)
                      })),
                h('div', { className: 'dshcb-actions', key: 'crop-actions' },
                  h('button', {
                    type: 'button',
                    className: 'dshcb-button dshcb-button-primary',
                    disabled: crop.loading || !sel || busy,
                    onClick: () => confirmSelection(selRef.current)
                  }, t('crop.useSelection')),
                  h('button', {
                    type: 'button',
                    className: 'dshcb-button',
                    disabled: crop.loading || busy,
                    onClick: applyFullImage
                  }, t('crop.useOriginal')),
                  h('button', {
                    type: 'button',
                    className: 'dshcb-button',
                    disabled: crop.loading || busy,
                    onClick: () => {
                      if (crop) updateSelection(defaultSelection(crop.naturalWidth, crop.naturalHeight, crop.ratio));
                    }
                  }, t('crop.reset')),
                  h('button', { type: 'button', className: 'dshcb-button', onClick: closeCrop }, t('crop.cancel'))))
            : h(React.Fragment, null,
                h('div', { className: 'dshcb-title', key: 'image-title' }, t('image.title')),
                h('div', { className: 'dshcb-desc', key: 'image-desc' }, t('image.description')),
                current.images.length === 0 && current.mode !== 'url' && !current.hasImage
                  ? h('div', { className: 'dshcb-desc', key: 'gallery-empty' }, t('gallery.empty'))
                  : null,
                h('div', { className: 'dshcb-gallery', key: 'gallery' },
                  current.mode === 'url' && current.url !== ''
                    ? h('div', { className: 'dshcb-thumb dshcb-thumb-selected', key: 'url-tile' },
                        h('img', { src: current.url, alt: '' }),
                        h('span', { className: 'dshcb-thumb-badge' }, t('gallery.link')))
                    : null,
                  current.images.map((entry) => h('div', {
                    key: entry.id,
                    className: `dshcb-thumb${current.mode === 'local' && current.selected === entry.id ? ' dshcb-thumb-selected' : ''}`,
                    'data-image-id': entry.id,
                    role: 'button',
                    tabIndex: 0,
                    title: t('gallery.use'),
                    'aria-label': t('gallery.use'),
                    'aria-disabled': busy || undefined,
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        if (!busy) selectImage(entry);
                      }
                    }
                  },
                    h('img', { src: thumbSrc(entry), alt: '', draggable: false }),
                    h('button', {
                      type: 'button',
                      className: 'dshcb-thumb-delete',
                      title: t('gallery.delete'),
                      disabled: busy,
                      onClick: (event) => {
                        event.stopPropagation();
                        deleteImageItem(entry);
                      }
                    }, '×'))),
                  h('button', {
                    type: 'button',
                    className: 'dshcb-thumb dshcb-thumb-add',
                    key: 'gallery-add',
                    title: t('gallery.add'),
                    disabled: busy || current.status === 'loading',
                    onClick: () => {
                      if (fileInput.current) fileInput.current.click();
                    }
                  }, '+')),
                h('div', { className: 'dshcb-actions', key: 'image-actions' },
                  h('button', {
                    type: 'button',
                    className: 'dshcb-button dshcb-button-primary',
                    disabled: busy || current.status === 'loading',
                    onClick: () => {
                      if (fileInput.current) fileInput.current.click();
                    }
                  }, t('image.choose')),
                  current.mode === 'local' && current.selected !== null
                    ? h('button', {
                        type: 'button',
                        className: 'dshcb-button',
                        disabled: busy || current.status === 'loading',
                        onClick: () => {
                          const entry = current.images.find((image) => image.id === current.selected);
                          if (entry) openCrop(thumbSrc(entry), false);
                        }
                      }, t('image.adjust'))
                    : null,
                  current.mode === 'url'
                    ? h('button', {
                        type: 'button',
                        className: 'dshcb-button',
                        disabled: busy || current.status === 'loading',
                        onClick: () => openCrop(current.url, true)
                      }, t('image.adjust'))
                    : null,
                  current.mode !== 'none'
                    ? h('button', {
                        type: 'button',
                        className: 'dshcb-button dshcb-button-danger',
                        disabled: busy || current.status === 'loading',
                        onClick: () => {
                          setUrlDraft('');
                          if (current.mode === 'url') commit({ mode: 'none', url: '' }, { mode: 'none', url: '' });
                          else if (current.selected !== null) run(() => deleteImage(current.selected));
                        }
                      }, t('image.remove'))
                    : null),
                h('input', {
                  key: 'image-input',
                  ref: fileInput,
                  type: 'file',
                  accept: 'image/*',
                  style: { display: 'none' },
                  onChange: pickFile
                }),
                h('div', { className: 'dshcb-urlRow', key: 'image-url' },
                  h('input', {
                    type: 'url',
                    className: 'dshcb-input',
                    placeholder: t('url.placeholder'),
                    value: urlDraft,
                    onChange: (event) => setUrlDraft(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyUrl();
                      }
                    },
                    'aria-label': t('image.title')
                  }),
                  h('button', { type: 'button', className: 'dshcb-button', disabled: busy, onClick: applyUrl }, t('url.apply')))),
          h('div', { className: 'dshcb-note', key: 'note' }, t('note.server'))),
        h('div', { className: 'dshcb-row' },
          h('div', { className: 'dshcb-copy' },
            h('div', { className: 'dshcb-title' }, t('dim.title')),
            h('div', { className: 'dshcb-desc' }, t('dim.description'))),
          h('div', { className: 'dshcb-sliderRow' },
            h('input', {
              type: 'range',
              className: 'dshcb-slider',
              min: 0,
              max: DIM_MAX,
              step: 5,
              value: current.dim,
              'aria-label': t('dim.title'),
              onChange: (event) => {
                const dim = clampInt(event.target.value, 0, DIM_MAX, current.dim);
                commit({ dim }, { dim });
              }
            }),
            h('span', { className: 'dshcb-value' }, `${current.dim}%`))),
        h('div', { className: 'dshcb-row' },
          h('div', { className: 'dshcb-copy' },
            h('div', { className: 'dshcb-title' }, t('blur.title')),
            h('div', { className: 'dshcb-desc' }, t('blur.description'))),
          h('div', { className: 'dshcb-sliderRow' },
            h('input', {
              type: 'range',
              className: 'dshcb-slider',
              min: 0,
              max: BLUR_MAX,
              step: 1,
              value: current.blur,
              'aria-label': t('blur.title'),
              onChange: (event) => {
                const blur = clampInt(event.target.value, 0, BLUR_MAX, current.blur);
                commit({ blur }, { blur });
              }
            }),
            h('span', { className: 'dshcb-value' }, `${current.blur}px`))));
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'custom-background: dictionaries');
      const t = ctx.locale.bind(NS);

      ctx.effect(() => {
        const previous = document.querySelector('style[data-plugin-css=' + JSON.stringify(STYLE_ID) + ']');
        if (previous) previous.remove();
        const tag = document.createElement('style');
        tag.dataset.plugin = '@local/custom-background';
        tag.dataset.pluginCss = STYLE_ID;
        tag.textContent = buildStyles(server);
        document.head.appendChild(tag);
        styleTag = tag;
        let disposed = false;
        const sync = () => {
          refresh().then(migrateLegacy).then((outcome) => {
            if (!disposed) report('sync', outcome);
          }).catch((syncError) => {
            if (disposed) return;
            publish({ ...server, status: 'error' });
            report('sync-failed', syncError && syncError.message);
          });
        };
        sync();
        const onVisible = () => {
          if (document.visibilityState === 'visible') sync();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
          disposed = true;
          document.removeEventListener('visibilitychange', onVisible);
          if (styleTag === tag) styleTag = undefined;
          tag.remove();
        };
      }, 'custom-background: wallpaper styles');

      ctx.effect(() => {
        const onClick = (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const thumb = target.closest('.dshcb-thumb[data-image-id]');
          if (thumb === null) return;
          if (target.closest('.dshcb-thumb-delete') !== null) return;
          const id = thumb.getAttribute('data-image-id') || '';
          if (id === '') return;
          event.preventDefault();
          event.stopPropagation();
          report('gallery-click', id);
          putSettings(
            { mode: 'local', selected: id, url: '', enabled: true },
            { mode: 'local', selected: id, url: '', enabled: true }
          ).then(() => {
            report('select-done', `${id}:ok:${server.selected}`);
          }).catch((error) => {
            report('select-failed', `${id}:${String(error && error.message)}`);
          });
        };
        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
      }, 'custom-background: gallery clicks');

      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'chat-background',
        order: 25,
        label: () => t('nav'),
        locale: NS
      }, BackgroundSection));
    }

    return { inject: ['slots', 'locale'], apply };
  }
});
